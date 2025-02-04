type ShaderType = WebGLRenderingContext["VERTEX_SHADER"] | WebGLRenderingContext["FRAGMENT_SHADER"];

const N_TIME_VALUES = 2;

function timeKey(index: number) {
  let key = "u_time";
  if (index > 0) key += String(index + 1);
  return key;
}

interface TimeState {
  seed: number;
  lastTime: number;
  elapsed: number;
  timeSpeed: number;
}

export class WebGLRenderer {
  private gl: WebGLRenderingContext;

  // private seed = 5983; // Math.random() * 100_000;
  private timeStates: TimeState[];

  private program: WebGLProgram;
  private positionBuffer: WebGLBuffer | null;
  private numPositions: number;
  private gradientTexture: WebGLTexture | null;
  private a_position: number;
  private u_timeList: Array<WebGLUniformLocation | null>;
  private u_w: WebGLUniformLocation | null;
  private u_h: WebGLUniformLocation | null;
  private u_gradient: WebGLUniformLocation | null;

  private uniformLocations = new Map<string, WebGLUniformLocation | null>();

  constructor(
    canvas: HTMLCanvasElement,
    vertexShader: string,
    fragmentShader: string,
    colorConfig: {
      gradient: string[];
      accentColor?: string | null;
    },
  ) {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) {
      throw new Error("Failed to acquire WebGL context");
    }
    this.gl = gl;
    this.numPositions = this.positions().length / 2; // Positions are vec2

    this.program = WebGLRenderer.createProgram(gl, vertexShader, fragmentShader);
    this.a_position = gl.getAttribLocation(this.program, "a_position");
    this.positionBuffer = gl.createBuffer();
    this.gradientTexture = gl.createTexture();
    this.u_gradient = gl.getUniformLocation(this.program, "u_gradient");
    this.u_timeList = Array.from({ length: N_TIME_VALUES }).map((_, i) =>
      gl.getUniformLocation(this.program, timeKey(i)),
    );
    this.u_w = gl.getUniformLocation(this.program, "u_w");
    this.u_h = gl.getUniformLocation(this.program, "u_h");

    this.timeStates = Array.from({ length: N_TIME_VALUES }).map(() => ({
      seed: Math.random() * 100_000,
      lastTime: Date.now(),
      elapsed: 0,
      timeSpeed: 1,
    }));

    WebGLRenderer.writeGradientToTexture(gl, colorConfig.gradient, this.gradientTexture, 1000, 2);

    gl.vertexAttribPointer(this.a_position, /* vec2 */ 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(this.program);
  }

  public render() {
    const { gl } = this;
    const now = Date.now();

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Set uniforms
    for (let i = 0; i < N_TIME_VALUES; i++) {
      const state = this.timeStates[i];
      state.elapsed += (now - state.lastTime) * state.timeSpeed;
      state.lastTime = now;
      const time = state.seed + state.elapsed / 1000;
      gl.uniform1f(this.u_timeList[i], time);
    }
    gl.uniform1f(this.u_w, gl.canvas.width);
    gl.uniform1f(this.u_h, gl.canvas.height);

    // Pass gradient texture
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.gradientTexture);
    gl.uniform1i(this.u_gradient, 1);

    // Clear canvas
    this.clear();

    // Draw 2 triangles forming quad
    gl.vertexAttribPointer(this.a_position, /* vec2 */ 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, this.numPositions);
  }

  public setUniform(key: string, value: number) {
    const { gl } = this;

    const location = this.getUniformLocation(key);
    gl.uniform1f(location, value);
  }

  public setTimeSpeed(value: number, index: number) {
    this.timeStates[index].timeSpeed = value;
  }

  public setWidth(width: number) {
    const { gl } = this;

    const canvas = gl.canvas;
    canvas.width = width;

    // Place positions into buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.positions()), gl.STATIC_DRAW);
  }

  private getUniformLocation(key: string): WebGLUniformLocation | null {
    let location = this.uniformLocations.get(key);
    if (location == null) {
      location = this.gl.getUniformLocation(this.program, key);
      this.uniformLocations.set(key, location);
    }
    return location;
  }

  private positions() {
    // prettier-ignore
    return [
      0, 0,   1, 0,   0, 1, // Top-left triangle
      1, 1,   1, 0,   0, 1, // Bottom-right triangle
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
