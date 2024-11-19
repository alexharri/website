import * as shaders from "./shaders";

type ShaderType = WebGLRenderingContext["VERTEX_SHADER"] | WebGLRenderingContext["FRAGMENT_SHADER"];

export class Renderer {
  private gl: WebGLRenderingContext;

  private startTime = Date.now();

  private sine__program: WebGLProgram;
  private sine__a_position: number;
  private sine__positionBuffer: WebGLBuffer | null;
  private sine__u_resolution: WebGLUniformLocation | null;
  private sine__u_time: WebGLUniformLocation | null;
  private numPositions: number;
  private sine__texture: WebGLTexture | null;

  private blur__program: WebGLProgram;
  private blur__u_resolution: WebGLUniformLocation | null;
  private blur__a_position: number;
  private blur__positionBuffer: WebGLBuffer | null;
  private blur__u_sine_texture: WebGLUniformLocation | null;

  constructor(canvas: HTMLCanvasElement, private W: number, private H: number) {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) {
      throw new Error("Failed to acquire WebGL context");
    }
    this.gl = gl;
    this.numPositions = this.positions().length / 2; // Positions are vec2

    // prettier-ignore
    this.sine__program = Renderer.createProgram(gl, shaders.vertexShader, shaders.sineWaveFragmentShader);
    this.sine__a_position = gl.getAttribLocation(this.sine__program, "a_position");
    this.sine__positionBuffer = gl.createBuffer();
    this.sine__texture = gl.createTexture();
    this.sine__u_resolution = gl.getUniformLocation(this.sine__program, "u_resolution");
    this.sine__u_time = gl.getUniformLocation(this.sine__program, "u_time");

    // Place positions into buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sine__positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions()), gl.STATIC_DRAW);

    // prettier-ignore -- Tell the attribute how to get data out of position buffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(this.sine__a_position, /* vec2 */ 2, gl.FLOAT, false, 0, 0);

    // Blur program
    // prettier-ignore
    this.blur__program = Renderer.createProgram(gl, shaders.vertexShader, shaders.blurFragmentShader);
    this.blur__a_position = gl.getAttribLocation(this.blur__program, "a_position");
    this.blur__u_resolution = gl.getUniformLocation(this.blur__program, "u_resolution");
    this.blur__positionBuffer = gl.createBuffer();
    this.blur__u_sine_texture = gl.getUniformLocation(this.blur__program, "u_sine_texture");

    // Place positions into buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.blur__positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions()), gl.STATIC_DRAW);
  }

  public render() {
    this.renderSine();
    this.renderBlur();
  }

  private renderBlur() {
    const { gl } = this;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.blur__program);

    // Set uniforms
    gl.uniform2f(this.blur__u_resolution, gl.canvas.width, gl.canvas.height);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sine__texture);
    gl.uniform1i(this.blur__u_sine_texture, 0);

    gl.enableVertexAttribArray(this.blur__a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.blur__positionBuffer);
    this.clear();
    gl.drawArrays(gl.TRIANGLES, 0, this.numPositions);
  }

  private renderSine() {
    const { gl, W, H } = this;
    const time = (Date.now() - this.startTime) / 1000;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.sine__program);

    // Set uniforms
    gl.uniform2f(this.sine__u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.sine__u_time, time);

    {
      // Render to texture
      gl.bindTexture(gl.TEXTURE_2D, this.sine__texture);
      const level = 0;
      gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

      // set the filtering so we don't need mips
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      // prettier-ignore
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sine__texture, level);
    }

    // Draw 2 triangles forming quad
    gl.enableVertexAttribArray(this.sine__a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.sine__positionBuffer);
    this.clear();
    gl.drawArrays(gl.TRIANGLES, 0, this.numPositions);
  }

  private positions() {
    const { W, H } = this;
    // prettier-ignore
    return [
      0, 0,   W, 0,   0, H, // Top-left triangle
      W, H,   W, 0,   0, H, // Bottom-right triangle
    ];
  }

  private clear() {
    const { gl } = this;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  private static createShader(
    gl: WebGLRenderingContext,
    type: ShaderType,
    source: string,
  ): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) {
      throw new Error("Failed to create shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }

    console.log(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error("Failed to compile shader");
  }

  private static createProgram(
    gl: WebGLRenderingContext,
    vertexShader: string,
    fragmentShader: string,
  ) {
    const program = gl.createProgram();
    if (!program) {
      throw new Error("Failed to create program");
    }
    gl.attachShader(program, this.createShader(gl, gl.VERTEX_SHADER, vertexShader));
    gl.attachShader(program, this.createShader(gl, gl.FRAGMENT_SHADER, fragmentShader));
    gl.linkProgram(program);
    const success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
      return program;
    }

    console.log(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error("Failed to create shader");
  }
}
