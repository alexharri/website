import { AsciiRenderConfig } from "../renderConfig";
import { CharacterSamplingData } from "../ascii/generateAsciiChars";
import { SamplingEffect } from "../types";
import { getAlphabetMetadata } from "../alphabets/AlphabetManager";
import {
  PASSTHROUGH_VERT,
  createSamplingFragmentShader,
  createMaxValueFragmentShader,
  createDirectionalCrunchFragmentShader,
  createGlobalCrunchFragmentShader,
  COPY_FRAGMENT_SHADER,
} from "./shaders";

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
  private numCircles: number;

  // WebGL resources
  private canvasTexture: WebGLTexture;
  private easingLUTTexture: WebGLTexture;

  // Framebuffers and textures for multi-pass rendering
  private rawSamplingFBO: WebGLFramebuffer;
  private rawSamplingTexture: WebGLTexture;

  private externalSamplingFBO: WebGLFramebuffer;
  private externalSamplingTexture: WebGLTexture;

  private maxValueFBO: WebGLFramebuffer;
  private maxValueTexture: WebGLTexture;

  private currentSamplingFBO: WebGLFramebuffer;
  private currentSamplingTexture: WebGLTexture;

  private nextSamplingFBO: WebGLFramebuffer;
  private nextSamplingTexture: WebGLTexture;

  // Shader programs
  private samplingProgram: WebGLProgram;
  private copyProgram: WebGLProgram;
  private maxValueProgram: WebGLProgram;
  private directionalCrunchProgram: WebGLProgram;
  private globalCrunchProgram: WebGLProgram;

  // Vertex array object for fullscreen quad
  private quadVAO: WebGLVertexArrayObject;

  // Pixel Buffer Objects for async readback
  private pbos: WebGLBuffer[];

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

    // Get number of sampling circles from alphabet config
    const metadata = getAlphabetMetadata(this.config.alphabet);
    this.numCircles = metadata.samplingConfig.points.length;

    // Calculate output texture dimensions
    // Each cell gets N pixels in a horizontal row (where N = number of circles)
    this.outputWidth = this.config.cols * this.numCircles;
    this.outputHeight = this.config.rows;

    // Initialize WebGL resources
    this.canvasTexture = this.createTexture()!;
    this.easingLUTTexture = this.createEasingLUTTexture(options.lightnessEasingFunction);

    // Create framebuffers and textures
    this.rawSamplingTexture = this.createFloatTexture(this.outputWidth, this.outputHeight)!;
    this.rawSamplingFBO = this.createFramebuffer(this.rawSamplingTexture)!;

    this.externalSamplingTexture = this.createFloatTexture(this.outputWidth, this.outputHeight)!;
    this.externalSamplingFBO = this.createFramebuffer(this.externalSamplingTexture)!;

    // Max value texture is cols × rows (one pixel per cell)
    this.maxValueTexture = this.createFloatTexture(this.config.cols, this.config.rows)!;
    this.maxValueFBO = this.createFramebuffer(this.maxValueTexture)!;

    // Current and next sampling textures for ping-pong buffering
    this.currentSamplingTexture = this.createFloatTexture(this.outputWidth, this.outputHeight)!;
    this.currentSamplingFBO = this.createFramebuffer(this.currentSamplingTexture)!;

    this.nextSamplingTexture = this.createFloatTexture(this.outputWidth, this.outputHeight)!;
    this.nextSamplingFBO = this.createFramebuffer(this.nextSamplingTexture)!;

    // Compile shaders (generate fragment shaders based on numCircles)
    const samplingFrag = createSamplingFragmentShader(this.numCircles);
    const samplingProgram = this.createProgram(PASSTHROUGH_VERT, samplingFrag);
    if (!samplingProgram) {
      throw new Error("Failed to create sampling program");
    }
    this.samplingProgram = samplingProgram;

    const copyProgram = this.createProgram(PASSTHROUGH_VERT, COPY_FRAGMENT_SHADER);
    if (!copyProgram) {
      throw new Error("Failed to create copy program");
    }
    this.copyProgram = copyProgram;

    const maxValueFrag = createMaxValueFragmentShader(this.numCircles);
    const maxValueProgram = this.createProgram(PASSTHROUGH_VERT, maxValueFrag);
    if (!maxValueProgram) {
      throw new Error("Failed to create max value program");
    }
    this.maxValueProgram = maxValueProgram;

    const directionalCrunchFrag = createDirectionalCrunchFragmentShader(this.numCircles);
    const directionalCrunchProgram = this.createProgram(PASSTHROUGH_VERT, directionalCrunchFrag);
    if (!directionalCrunchProgram) {
      throw new Error("Failed to create directional crunch program");
    }
    this.directionalCrunchProgram = directionalCrunchProgram;

    const globalCrunchFrag = createGlobalCrunchFragmentShader(this.numCircles);
    const globalCrunchProgram = this.createProgram(PASSTHROUGH_VERT, globalCrunchFrag);
    if (!globalCrunchProgram) {
      throw new Error("Failed to create global crunch program");
    }
    this.globalCrunchProgram = globalCrunchProgram;

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
    flipY: boolean,
    pixelBufferScale: number,
  ): void {
    this.pixelBufferScale = pixelBufferScale;
    this.uploadCanvasTexture(pixelBuffer);

    this.collectRawSamples(flipY);
    this.collectExternalSamples(flipY);

    const applyCrunchEffect = this.samplingEffects.includes(SamplingEffect.Crunch);
    if (applyCrunchEffect) {
      this.applyCrunchEffects();
    }

    this.readbackAndParse(out);

    this.checkGLError("Update");
  }

  /**
   * Render raw sampling pass (internal points)
   */
  private collectRawSamples(flipY: boolean): void {
    const metadata = getAlphabetMetadata(this.config.alphabet);
    const samplingConfig = metadata.samplingConfig;

    this.renderPass(this.rawSamplingFBO, this.samplingProgram, (program) =>
      this.setSamplingUniforms(program, samplingConfig.points, flipY),
    );

    // Copy raw sampling to current buffer (avoids feedback loops in effect passes)
    this.renderPass(this.currentSamplingFBO, this.copyProgram, (program) => {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.rawSamplingTexture);
      gl.uniform1i(gl.getUniformLocation(program, "u_inputTexture"), 0);
    });
  }

  /**
   * Render external sampling pass (external points)
   */
  private collectExternalSamples(flipY: boolean): void {
    const metadata = getAlphabetMetadata(this.config.alphabet);
    const samplingConfig = metadata.samplingConfig;
    const externalPoints = "externalPoints" in samplingConfig ? samplingConfig.externalPoints : [];

    // Skip if no external points defined
    if (!externalPoints || externalPoints.length === 0) {
      return;
    }

    this.renderPass(this.externalSamplingFBO, this.samplingProgram, (program) =>
      this.setSamplingUniforms(program, externalPoints, flipY),
    );
  }

  /**
   * Apply crunch effects (directional crunch, then global crunch)
   */
  private applyCrunchEffects(): void {
    this.applyDirectionalCrunch();
    this.applyGlobalCrunch();
  }

  /**
   * Apply directional crunch: enhance contrast based on external context
   */
  private applyDirectionalCrunch(): void {
    this.renderPass(this.nextSamplingFBO, this.directionalCrunchProgram, (program) =>
      this.setDirectionalCrunchUniforms(program),
    );
    this.swapSamplingBuffers();
  }

  /**
   * Apply global crunch: normalize by cell max value
   * Computes max from current sampling texture (after directional crunch if applied)
   */
  private applyGlobalCrunch(): void {
    // Compute max value per cell from current sampling texture
    this.renderPass(
      this.maxValueFBO,
      this.maxValueProgram,
      (program) => this.setMaxValueUniforms(program),
      this.config.cols,
      this.config.rows,
    );

    // Apply global crunch using max values
    this.renderPass(this.nextSamplingFBO, this.globalCrunchProgram, (program) =>
      this.setGlobalCrunchUniforms(program),
    );
    this.swapSamplingBuffers();
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
    width?: number,
    height?: number,
  ): void {
    const gl = this.gl;

    // Bind framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, width ?? this.outputWidth, height ?? this.outputHeight);

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
    gl.uniform1i(gl.getUniformLocation(program, "u_numCircles"), this.numCircles);

    // Sampling points
    const pointsLoc = gl.getUniformLocation(program, "u_samplingPoints");
    const points = samplingPoints.flatMap((p) => [p.x, p.y]);
    gl.uniform2fv(pointsLoc, points);

    gl.uniform1f(gl.getUniformLocation(program, "u_circleRadius"), samplingConfig.circleRadius);
  }

  /**
   * Set uniforms for max value pass
   */
  private setMaxValueUniforms(program: WebGLProgram): void {
    const gl = this.gl;

    // Input texture (current sampling vector)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.currentSamplingTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_rawSamplingTexture"), 0);

    // Grid size and circle count
    gl.uniform2f(gl.getUniformLocation(program, "u_gridSize"), this.config.cols, this.config.rows);
    gl.uniform1i(gl.getUniformLocation(program, "u_numCircles"), this.numCircles);
  }

  /**
   * Set uniforms for directional crunch pass
   */
  private setDirectionalCrunchUniforms(program: WebGLProgram): void {
    const gl = this.gl;

    // Input texture (current sampling vector)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.currentSamplingTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_inputTexture"), 0);

    // External sampling texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.externalSamplingTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_externalSamplingTexture"), 1);

    // Grid size and circle count
    gl.uniform2f(gl.getUniformLocation(program, "u_gridSize"), this.config.cols, this.config.rows);
    gl.uniform1i(gl.getUniformLocation(program, "u_numCircles"), this.numCircles);
  }

  /**
   * Set uniforms for global crunch pass
   */
  private setGlobalCrunchUniforms(program: WebGLProgram): void {
    const gl = this.gl;

    // Input texture (current sampling vector)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.currentSamplingTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_inputTexture"), 0);

    // Max value texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.maxValueTexture);
    gl.uniform1i(gl.getUniformLocation(program, "u_maxValueTexture"), 1);

    // Grid size and circle count
    gl.uniform2f(gl.getUniformLocation(program, "u_gridSize"), this.config.cols, this.config.rows);
    gl.uniform1i(gl.getUniformLocation(program, "u_numCircles"), this.numCircles);
  }

  /**
   * Swap current and next sampling buffers for ping-pong rendering
   */
  private swapSamplingBuffers(): void {
    const tempTexture = this.currentSamplingTexture;
    const tempFBO = this.currentSamplingFBO;

    this.currentSamplingTexture = this.nextSamplingTexture;
    this.currentSamplingFBO = this.nextSamplingFBO;

    this.nextSamplingTexture = tempTexture;
    this.nextSamplingFBO = tempFBO;
  }

  /**
   * Read back results and parse into CharacterSamplingData
   */
  private readbackAndParse(out: CharacterSamplingData[][]): void {
    const gl = this.gl;

    const READBACK_RAW = false;
    const READBACK_EXTERNAL = false;

    // Read back all three textures synchronously (for now)
    // TODO: Optimize with async readback for all textures

    let rawData: Float32Array | null = null;
    let externalData: Float32Array | null = null;

    if (READBACK_RAW) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.rawSamplingFBO);
      rawData = new Float32Array(this.outputWidth * this.outputHeight * 4);
      gl.readPixels(0, 0, this.outputWidth, this.outputHeight, gl.RGBA, gl.FLOAT, rawData);
    }

    if (READBACK_EXTERNAL) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.externalSamplingFBO);
      externalData = new Float32Array(this.outputWidth * this.outputHeight * 4);
      gl.readPixels(0, 0, this.outputWidth, this.outputHeight, gl.RGBA, gl.FLOAT, externalData);
    }

    // Read current sampling vector (final output after all effects)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.currentSamplingFBO);
    const finalData = new Float32Array(this.outputWidth * this.outputHeight * 4);
    gl.readPixels(0, 0, this.outputWidth, this.outputHeight, gl.RGBA, gl.FLOAT, finalData);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Parse data into output array
    this.parseReadbackData(finalData, rawData, externalData, out);
  }

  /**
   * Parse readback data into CharacterSamplingData array
   */
  private parseReadbackData(
    finalData: Float32Array,
    rawData: Float32Array | null,
    externalData: Float32Array | null,
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

        // Read N circles for this cell (N = numCircles)
        for (let circleIdx = 0; circleIdx < this.numCircles; circleIdx++) {
          // Reverse circle order - texture stores them backwards
          const pixelX = col * this.numCircles + (this.numCircles - 1 - circleIdx);
          const pixelY = row;

          const pixelIndex = (pixelY * this.outputWidth + pixelX) * 4;

          // Read from all three textures
          // Crunch is now applied in GPU shader, so read final values from crunchedData
          samplingVector.push(finalData[pixelIndex]); // Final crunched value
          if (rawData) rawSamplingVector.push(rawData[pixelIndex]); // Raw value
          if (externalData) externalSamplingVector.push(externalData[pixelIndex]); // External value
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
    gl.deleteTexture(this.maxValueTexture);
    gl.deleteTexture(this.currentSamplingTexture);
    gl.deleteTexture(this.nextSamplingTexture);

    // Delete framebuffers
    gl.deleteFramebuffer(this.rawSamplingFBO);
    gl.deleteFramebuffer(this.externalSamplingFBO);
    gl.deleteFramebuffer(this.maxValueFBO);
    gl.deleteFramebuffer(this.currentSamplingFBO);
    gl.deleteFramebuffer(this.nextSamplingFBO);

    // Delete programs
    gl.deleteProgram(this.samplingProgram);
    gl.deleteProgram(this.copyProgram);
    gl.deleteProgram(this.maxValueProgram);
    gl.deleteProgram(this.directionalCrunchProgram);
    gl.deleteProgram(this.globalCrunchProgram);

    // Delete VAO
    gl.deleteVertexArray(this.quadVAO);

    // Delete PBOs
    this.pbos.forEach((pbo) => gl.deleteBuffer(pbo));
  }
}
