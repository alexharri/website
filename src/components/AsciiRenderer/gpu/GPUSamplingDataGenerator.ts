import { AsciiRenderConfig } from "../renderConfig";
import { CharacterSamplingData } from "../ascii/generateAsciiChars";
import { SamplingEffect } from "../types";
import { getAlphabetMetadata } from "../alphabets/AlphabetManager";
import { PASSTHROUGH_VERT, SAMPLING_FRAG, CRUNCH_FRAG } from "./shaders";

interface GPUSamplingDataGeneratorOptions {
  config: AsciiRenderConfig;
  canvasWidth: number;
  canvasHeight: number;
  pixelBufferScale: number;
  samplingQuality: number;
  lightnessEasingFunction?: string;
  samplingEffects: SamplingEffect[];
}

/**
 * GPU-accelerated sampling data generator using WebGL2
 * Replaces CPU-based generateSamplingData for improved performance on mobile
 */
export class GPUSamplingDataGenerator {
  private gl: WebGL2RenderingContext;
  private config: AsciiRenderConfig;
  private canvasWidth: number;
  private canvasHeight: number;
  private pixelBufferScale: number;
  private samplingQuality: number;
  private samplingEffects: SamplingEffect[];

  // WebGL resources
  private canvasTexture: WebGLTexture;
  private easingLUTTexture: WebGLTexture;

  // Framebuffers and textures for multi-pass rendering
  private rawSamplingFBO: WebGLFramebuffer;
  private rawSamplingTexture: WebGLTexture;

  private externalSamplingFBO: WebGLFramebuffer;
  private externalSamplingTexture: WebGLTexture;

  private crunchFBO: WebGLFramebuffer;
  private crunchTexture: WebGLTexture;

  // Shader programs
  private samplingProgram: WebGLProgram;
  private crunchProgram: WebGLProgram;

  // Vertex array object for fullscreen quad
  private quadVAO: WebGLVertexArrayObject;

  // Pixel Buffer Objects for async readback
  private pbos: WebGLBuffer[];
  private currentPBOIndex: number = 0;

  // Output dimensions
  private outputWidth: number;
  private outputHeight: number;

  constructor(canvas: HTMLCanvasElement, options: GPUSamplingDataGeneratorOptions) {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      depth: false,
      stencil: false,
      alpha: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    });

    if (!gl) {
      throw new Error("WebGL2 not supported");
    }

    this.gl = gl;
    this.config = options.config;
    this.canvasWidth = options.canvasWidth;
    this.canvasHeight = options.canvasHeight;
    this.pixelBufferScale = options.pixelBufferScale;
    this.samplingQuality = options.samplingQuality;
    this.samplingEffects = options.samplingEffects;

    // Calculate output texture dimensions
    // Each cell has 6 sampling circles
    // We'll pack them as 2 circles per row, 3 rows per cell
    this.outputWidth = this.config.cols * 2;
    this.outputHeight = this.config.rows * 3;

    // Initialize WebGL resources
    this.canvasTexture = this.createTexture()!;
    this.easingLUTTexture = this.createEasingLUTTexture(options.lightnessEasingFunction);

    // Create framebuffers and textures
    this.rawSamplingTexture = this.createFloatTexture(this.outputWidth, this.outputHeight)!;
    this.rawSamplingFBO = this.createFramebuffer(this.rawSamplingTexture)!;

    this.externalSamplingTexture = this.createFloatTexture(this.outputWidth, this.outputHeight)!;
    this.externalSamplingFBO = this.createFramebuffer(this.externalSamplingTexture)!;

    this.crunchTexture = this.createFloatTexture(this.outputWidth, this.outputHeight)!;
    this.crunchFBO = this.createFramebuffer(this.crunchTexture)!;

    // Compile shaders
    const samplingProgram = this.createProgram(PASSTHROUGH_VERT, SAMPLING_FRAG);
    if (!samplingProgram) {
      throw new Error("Failed to create sampling program");
    }
    this.samplingProgram = samplingProgram;

    const crunchProgram = this.createProgram(PASSTHROUGH_VERT, CRUNCH_FRAG);
    if (!crunchProgram) {
      throw new Error("Failed to create crunch program");
    }
    this.crunchProgram = crunchProgram;

    // Create fullscreen quad
    this.quadVAO = this.createQuadVAO()!;

    // Create PBOs for async readback (double buffering)
    this.pbos = [this.createPBO()!, this.createPBO()!];

    // Check for errors
    this.checkGLError("Constructor");
  }

  /**
   * Update sampling data from a new canvas buffer
   */
  public update(
    pixelBuffer: Uint8Array,
    out: CharacterSamplingData[][],
    flipY: boolean = false,
    pixelBufferScale?: number,
  ): void {
    // Update pixel buffer scale if provided
    if (pixelBufferScale !== undefined) {
      this.pixelBufferScale = pixelBufferScale;
    }

    // Upload canvas texture
    this.uploadCanvasTexture(pixelBuffer);

    // Get sampling configuration
    const metadata = getAlphabetMetadata(this.config.alphabet);
    const samplingConfig = metadata.samplingConfig;

    // Pass 1: Raw sampling (internal points)
    this.renderPass(this.rawSamplingFBO, this.samplingProgram, (program) =>
      this.setSamplingUniforms(program, samplingConfig.points, flipY),
    );

    // Pass 2: External sampling (external points)
    const externalPoints = "externalPoints" in samplingConfig ? samplingConfig.externalPoints : [];
    this.renderPass(this.externalSamplingFBO, this.samplingProgram, (program) =>
      this.setSamplingUniforms(program, externalPoints || [], flipY),
    );

    // Pass 3: Crunch
    this.renderPass(this.crunchFBO, this.crunchProgram, (program) =>
      this.setCrunchUniforms(program),
    );

    // Async readback using PBO
    this.readbackAndParse(out);

    this.checkGLError("Update");
  }

  /**
   * Upload canvas pixel buffer to texture
   */
  private uploadCanvasTexture(pixelBuffer: Uint8Array): void {
    const gl = this.gl;
    const scaledWidth = Math.floor(this.canvasWidth * this.pixelBufferScale);
    const scaledHeight = Math.floor(this.canvasHeight * this.pixelBufferScale);

    gl.bindTexture(gl.TEXTURE_2D, this.canvasTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      scaledWidth,
      scaledHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixelBuffer,
    );
  }

  /**
   * Render a single pass
   */
  private renderPass(
    fbo: WebGLFramebuffer,
    program: WebGLProgram,
    setUniforms: (program: WebGLProgram) => void,
  ): void {
    const gl = this.gl;

    // Bind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, this.outputWidth, this.outputHeight);

    // Use program
    gl.useProgram(program);

    // Set uniforms
    setUniforms(program);

    // Draw fullscreen quad
    gl.bindVertexArray(this.quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  /**
   * Set uniforms for sampling pass (used for both raw and external)
   */
  private setSamplingUniforms(
    program: WebGLProgram,
    samplingPoints: Array<{ x: number; y: number }>,
    flipY: boolean,
  ): void {
    const gl = this.gl;
    const metadata = getAlphabetMetadata(this.config.alphabet);
    const samplingConfig = metadata.samplingConfig;

    // Textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.canvasTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_canvasTexture"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.easingLUTTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_easingLUT"), 1);

    // Canvas and grid parameters
    const scaledWidth = this.canvasWidth * this.pixelBufferScale;
    const scaledHeight = this.canvasHeight * this.pixelBufferScale;
    gl.uniform2f(gl.getUniformLocation(program, "u_canvasSize"), scaledWidth, scaledHeight);
    gl.uniform2f(gl.getUniformLocation(program, "u_gridSize"), this.config.cols, this.config.rows);
    gl.uniform2f(
      gl.getUniformLocation(program, "u_boxSize"),
      this.config.boxWidth,
      this.config.boxHeight,
    );
    gl.uniform2f(
      gl.getUniformLocation(program, "u_gridOffset"),
      this.config.offsetX,
      this.config.offsetY,
    );
    gl.uniform1f(gl.getUniformLocation(program, "u_pixelBufferScale"), this.pixelBufferScale);
    gl.uniform1i(gl.getUniformLocation(program, "u_flipY"), flipY ? 1 : 0);
    gl.uniform1i(gl.getUniformLocation(program, "u_samplingQuality"), this.samplingQuality);

    // Sampling points
    const pointsLoc = gl.getUniformLocation(program, "u_samplingPoints");
    const points = samplingPoints.flatMap((p) => [p.x, p.y]);
    gl.uniform2fv(pointsLoc, points);

    gl.uniform1f(gl.getUniformLocation(program, "u_circleRadius"), samplingConfig.circleRadius);
  }

  /**
   * Set uniforms for crunch pass
   */
  private setCrunchUniforms(program: WebGLProgram): void {
    const gl = this.gl;

    // Input textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.rawSamplingTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_rawSamplingTexture"), 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.externalSamplingTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_externalSamplingTexture"), 1);

    // Grid size for texture coordinate calculations
    gl.uniform2f(gl.getUniformLocation(program, "u_gridSize"), this.config.cols, this.config.rows);

    // Crunch effects (both available but can be controlled independently)
    const useCrunch = this.samplingEffects.includes(SamplingEffect.Crunch);
    gl.uniform1i(gl.getUniformLocation(program, "u_useGlobalCrunch"), useCrunch ? 1 : 0);
    gl.uniform1i(gl.getUniformLocation(program, "u_useDirectionalCrunch"), useCrunch ? 1 : 0);
  }

  /**
   * Read back results and parse into CharacterSamplingData
   */
  private readbackAndParse(out: CharacterSamplingData[][]): void {
    const gl = this.gl;

    // Read back all three textures synchronously (for now)
    // TODO: Optimize with async readback for all textures

    // Read raw sampling texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.rawSamplingFBO);
    const rawData = new Float32Array(this.outputWidth * this.outputHeight * 4);
    gl.readPixels(0, 0, this.outputWidth, this.outputHeight, gl.RGBA, gl.FLOAT, rawData);

    // Read external sampling texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.externalSamplingFBO);
    const externalData = new Float32Array(this.outputWidth * this.outputHeight * 4);
    gl.readPixels(0, 0, this.outputWidth, this.outputHeight, gl.RGBA, gl.FLOAT, externalData);

    // Read crunched sampling texture
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.crunchFBO);
    const crunchedData = new Float32Array(this.outputWidth * this.outputHeight * 4);
    gl.readPixels(0, 0, this.outputWidth, this.outputHeight, gl.RGBA, gl.FLOAT, crunchedData);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Parse data into output array
    this.parseReadbackData(rawData, externalData, crunchedData, out);
  }

  /**
   * Parse readback data into CharacterSamplingData array
   */
  private parseReadbackData(
    rawData: Float32Array,
    externalData: Float32Array,
    crunchedData: Float32Array,
    out: CharacterSamplingData[][],
  ): void {
    // Data is packed as: 3 circles per row, 2 rows per cell
    // Each pixel contains one sampling value in the red channel

    // Ensure output array is properly initialized
    for (let row = 0; row < this.config.rows; row++) {
      if (!out[row]) {
        out[row] = [];
      }
      for (let col = 0; col < this.config.cols; col++) {
        if (!out[row][col]) {
          out[row][col] = {
            samplingVector: [],
            rawSamplingVector: [],
            externalSamplingVector: [],
            samplingVectorSubsamples: [],
          };
        }

        const samplingVector: number[] = [];
        const rawSamplingVector: number[] = [];
        const externalSamplingVector: number[] = [];

        // Read 6 circles for this cell
        for (let circleIdx = 0; circleIdx < 6; circleIdx++) {
          const circleRow = Math.floor(circleIdx / 2);
          const circleCol = circleIdx % 2;

          const pixelX = col * 2 + circleCol;
          const pixelY = row * 3 + circleRow;

          const pixelIndex = (pixelY * this.outputWidth + pixelX) * 4;

          // Read from all three textures
          // Crunch is now applied in GPU shader, so read final values from crunchedData
          samplingVector.push(crunchedData[pixelIndex]); // Final crunched value
          rawSamplingVector.push(rawData[pixelIndex]); // Raw value
          externalSamplingVector.push(externalData[pixelIndex]); // External value
        }

        // Update output array (note: subsamples not collected in GPU path)
        out[row][col].samplingVector = samplingVector;
        out[row][col].rawSamplingVector = rawSamplingVector;
        out[row][col].externalSamplingVector = externalSamplingVector;
        out[row][col].samplingVectorSubsamples = []; // Not collected in GPU path
      }
    }
  }

  /**
   * Create a 2D texture
   */
  private createTexture(): WebGLTexture | null {
    const gl = this.gl;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return texture;
  }

  /**
   * Create a float texture for rendering
   */
  private createFloatTexture(width: number, height: number): WebGLTexture | null {
    const gl = this.gl;

    // Check if float texture filtering is supported
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) {
      console.warn("EXT_color_buffer_float not supported, GPU acceleration may not work");
    }

    const texture = this.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
    return texture;
  }

  /**
   * Create easing LUT texture
   */
  private createEasingLUTTexture(_easingFunction?: string): WebGLTexture {
    const gl = this.gl;

    // Generate LUT data (same as CPU version)
    const LUT_SIZE = 512;
    const data = new Float32Array(LUT_SIZE + 1);

    // For now, use a simple power curve. TODO: Support custom easing functions
    for (let i = 0; i <= LUT_SIZE; i++) {
      const t = i / LUT_SIZE;
      data[i] = t; // Linear for now
    }

    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, LUT_SIZE + 1, 1, 0, gl.RED, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
  }

  /**
   * Create a framebuffer with texture attachment
   */
  private createFramebuffer(texture: WebGLTexture): WebGLFramebuffer | null {
    const gl = this.gl;
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      const statusName =
        {
          [gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT",
          [gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]:
            "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT",
          [gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS",
          [gl.FRAMEBUFFER_UNSUPPORTED]: "FRAMEBUFFER_UNSUPPORTED",
          [gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE]: "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE",
        }[status] || `UNKNOWN (${status})`;

      console.error("Framebuffer not complete:", statusName);
      console.error("This usually means RGBA32F textures are not supported for rendering.");
      console.error("Try enabling EXT_color_buffer_float extension.");
      return null;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return fbo;
  }

  /**
   * Compile and link shader program
   */
  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    const gl = this.gl;

    const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
      console.error("Failed to compile shaders");
      if (vertexShader) gl.deleteShader(vertexShader);
      if (fragmentShader) gl.deleteShader(fragmentShader);
      return null;
    }

    const program = gl.createProgram();
    if (!program) {
      console.error("Failed to create program object");
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      return null;
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    // Shaders can be deleted after linking
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  /**
   * Compile a shader
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    const shader = gl.createShader(type);
    if (!shader) {
      console.error("Failed to create shader object");
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const shaderType = type === gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT";
      console.error(`${shaderType} shader compile error:`, gl.getShaderInfoLog(shader));
      console.error("Shader source (first 500 chars):", source.substring(0, 500));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Create VAO for fullscreen quad
   */
  private createQuadVAO(): WebGLVertexArrayObject | null {
    const gl = this.gl;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Fullscreen quad vertices (triangle strip)
    const vertices = new Float32Array([
      -1,
      -1, // Bottom-left
      1,
      -1, // Bottom-right
      -1,
      1, // Top-left
      1,
      1, // Top-right
    ]);

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Position attribute
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
    return vao;
  }

  /**
   * Create a Pixel Buffer Object for async readback
   */
  private createPBO(): WebGLBuffer | null {
    const gl = this.gl;
    const pbo = gl.createBuffer();
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo);

    // Allocate buffer size for RGBA32F data
    const bufferSize = this.outputWidth * this.outputHeight * 4 * 4; // 4 floats per pixel
    gl.bufferData(gl.PIXEL_PACK_BUFFER, bufferSize, gl.STREAM_READ);

    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    return pbo;
  }

  /**
   * Check for GL errors
   */
  private checkGLError(context: string): void {
    const gl = this.gl;
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
      console.error(`WebGL error in ${context}:`, error);
    }
  }

  /**
   * Clean up WebGL resources
   */
  public dispose(): void {
    const gl = this.gl;

    // Delete textures
    gl.deleteTexture(this.canvasTexture);
    gl.deleteTexture(this.easingLUTTexture);
    gl.deleteTexture(this.rawSamplingTexture);
    gl.deleteTexture(this.externalSamplingTexture);
    gl.deleteTexture(this.crunchTexture);

    // Delete framebuffers
    gl.deleteFramebuffer(this.rawSamplingFBO);
    gl.deleteFramebuffer(this.externalSamplingFBO);
    gl.deleteFramebuffer(this.crunchFBO);

    // Delete programs
    gl.deleteProgram(this.samplingProgram);
    gl.deleteProgram(this.crunchProgram);

    // Delete VAO
    gl.deleteVertexArray(this.quadVAO);

    // Delete PBOs
    this.pbos.forEach((pbo) => gl.deleteBuffer(pbo));
  }
}
