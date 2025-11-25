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

interface ColorConfiguration {
  gradient: string[];
}

export class WebGLRenderer {
  private timeStates: TimeState[];

  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private positionBuffer: WebGLBuffer | null;
  private gradientTexture: WebGLTexture | null;

  private a_position: number;

  private uniformLocations = new Map<string, WebGLUniformLocation | null>();

  constructor(
    canvas: HTMLCanvasElement,
    vertexShader: string,
    fragmentShader: string,
    colorConfig: ColorConfiguration,
    seed: number | undefined,
  ) {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) {
      throw new Error("Failed to acquire WebGL context");
    }
    this.gl = gl;
    this.program = WebGLRenderer.createProgram(gl, vertexShader, fragmentShader);
    this.positionBuffer = gl.createBuffer();
    this.gradientTexture = gl.createTexture();
    this.a_position = gl.getAttribLocation(this.program, "a_position");

    seed ??= Math.random() * 100_000;
    this.timeStates = Array.from({ length: N_TIME_VALUES }).map(() => ({
      seed,
      lastTime: Date.now(),
      elapsed: 0,
      timeSpeed: 1,
    }));

    WebGLRenderer.writeGradientToTexture(gl, colorConfig.gradient, this.gradientTexture, 1000, 2);

    gl.vertexAttribPointer(this.a_position, /* vec2 */ 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(this.program);
  }

  public setColorConfig(colorConfig: ColorConfiguration) {
    const { gl } = this;
    WebGLRenderer.writeGradientToTexture(gl, colorConfig.gradient, this.gradientTexture, 1000, 2);
  }

  public getSeed() {
    const state = this.timeStates[0];
    return state.seed;
  }

  public getTime() {
    const state = this.timeStates[0];
    return state.elapsed / 1000;
  }

  public getGLContext() {
    return this.gl;
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
      gl.uniform1f(this.getUniformLocation(timeKey(i)), time);
    }
    gl.uniform1f(this.getUniformLocation("u_w"), gl.canvas.width);
    gl.uniform1f(this.getUniformLocation("u_h"), gl.canvas.height);

    // Pass gradient texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.gradientTexture);
    gl.uniform1i(this.getUniformLocation("u_gradient"), 0);

    // Clear canvas
    this.clear();

    // Draw 2 triangles forming quad
    gl.vertexAttribPointer(this.a_position, /* vec2 */ 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.a_position);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.drawArrays(gl.TRIANGLES, 0, this.positions().length / 2);
  }

  public setUniform(key: string, value: number) {
    const timeKeyMatch = /^time(?<num>[1-9]?)$/.exec(key);
    if (timeKeyMatch) {
      const numString = timeKeyMatch.groups?.num;
      const index = numString ? Number(numString) - 1 : 0;
      // The special key "time" controls the renderer time speed
      this.setTimeSpeed(index, value);
      return;
    }
    this.gl.uniform1f(this.getUniformLocation(key), value);
  }

  public setTimeSpeed(index: number, value: number) {
    this.timeStates[index].timeSpeed = value;
  }

  public setDimensions(width: number, height: number) {
    const { gl } = this;

    const canvas = gl.canvas;
    canvas.width = width;
    canvas.height = height;

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
    type: WebGLRenderingContext["VERTEX_SHADER"] | WebGLRenderingContext["FRAGMENT_SHADER"],
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
