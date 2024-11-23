import * as shaders from "./shaders";

type ShaderType = WebGLRenderingContext["VERTEX_SHADER"] | WebGLRenderingContext["FRAGMENT_SHADER"];

export class Renderer {
  private gl: WebGLRenderingContext;

  private startTime = Date.now() + Math.random() * 100000000;

  private program: WebGLProgram;
  private positionBuffer: WebGLBuffer | null;
  private numPositions: number;
  private gradientTexture: WebGLTexture | null;
  private a_position: number;
  private u_resolution: WebGLUniformLocation | null;
  private u_time: WebGLUniformLocation | null;
  private u_gradient: WebGLUniformLocation | null;

  constructor(
    canvas: HTMLCanvasElement,
    colorConfig: {
      gradient: string[];
      accentColor?: string | null;
    },
    private W: number,
    private H: number,
  ) {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) {
      throw new Error("Failed to acquire WebGL context");
    }
    this.gl = gl;
    this.numPositions = this.positions().length / 2; // Positions are vec2

    // prettier-ignore
    this.program = Renderer.createProgram(
      gl,
      shaders.vertexShader,
      shaders.createFragmentShader({ accentColor: colorConfig.accentColor }),
    );
    this.a_position = gl.getAttribLocation(this.program, "a_position");
    this.positionBuffer = gl.createBuffer();
    this.gradientTexture = gl.createTexture();
    this.u_gradient = gl.getUniformLocation(this.program, "u_gradient");
    this.u_resolution = gl.getUniformLocation(this.program, "u_resolution");
    this.u_time = gl.getUniformLocation(this.program, "u_time");

    Renderer.writeGradientToTexture(gl, colorConfig.gradient, this.gradientTexture, 1000, 2);

    // Place positions into buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions()), gl.STATIC_DRAW);

    // prettier-ignore -- Tell the attribute how to get data out of position buffer (ARRAY_BUFFER)
    gl.vertexAttribPointer(this.a_position, /* vec2 */ 2, gl.FLOAT, false, 0, 0);
  }

  public render() {
    this.renderSine();
  }

  private renderSine() {
    const { gl } = this;
    const time = (Date.now() - this.startTime) / 1000;

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.useProgram(this.program);

    // Set uniforms
    gl.uniform2f(this.u_resolution, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(this.u_time, time);

    // Pass gradient texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.gradientTexture);
    gl.uniform1i(this.u_gradient, 1);

    // Draw 2 triangles forming quad
    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
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

  private static writeGradientToTexture(
    gl: WebGLRenderingContext,
    gradient: string[],
    texture: WebGLTexture | null,
    width: number,
    height: number,
  ) {
    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.height = height;
    canvas.width = width;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas 2D context");

    // Render gradient to texture
    const linearGradient = ctx.createLinearGradient(0, 0, width, 0);
    for (const [i, stop] of gradient.entries()) {
      const t = i / (gradient.length - 1);
      linearGradient.addColorStop(t, stop);
    }
    ctx.fillStyle = linearGradient;
    ctx.fillRect(0, 0, width, height);

    // Write canvas to texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
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
