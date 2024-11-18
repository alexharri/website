import { useEffect, useRef } from "react";
import { StyleOptions, useStyles } from "../../utils/styles";
import * as shaders from "./shaders";

const W = 800;
const H = 400;

const styles = ({ styled, theme }: StyleOptions) => ({
  container: styled.css`
    border: 1px solid ${theme.blue};
    width: ${W + 16}px;
    height: ${H + 16}px;
    padding: 7px;
    border-radius: 4px;
    margin: 0 auto;
  `,
});

type ShaderType = WebGLRenderingContext["VERTEX_SHADER"] | WebGLRenderingContext["FRAGMENT_SHADER"];

function createShader(gl: WebGLRenderingContext, type: ShaderType, source: string): WebGLShader {
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

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
) {
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Failed to create program");
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }

  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
  throw new Error("Failed to create shader");
}

export const TestCanvas = () => {
  const s = useStyles(styles);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let stop = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl")!;
    if (!gl) {
      console.error("Failed to acquire WebGL context");
      return () => {};
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, shaders.vertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, shaders.fragmentShader);

    const program = createProgram(gl, vertexShader, fragmentShader);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // prettier-ignore
    const positions = [
      // Top-left triangle
      0, 0,
      W, 0,
      0, H,
      // Bottom-right triangle
      W, H,
      W, 0,
      0, H,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    function clear() {
      // Clear the canvas
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    gl.useProgram(program);

    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    const u_timeLocation = gl.getUniformLocation(program, "u_time");

    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
    {
      const size = 2; // 2 components per iteration
      const type = gl.FLOAT; // the data is 32bit floats
      const normalize = false; // don't normalize the data
      const stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
      const offset = 0; // start at the beginning of the buffer
      gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    }

    const start = Date.now();

    function tick() {
      if (stop) return;
      requestAnimationFrame(tick);

      const time = (Date.now() - start) / 1000;
      gl.uniform1f(u_timeLocation, time);
      clear();

      {
        const mode = gl.TRIANGLES;
        const offset = 0;
        const count = positions.length / 2;
        gl.drawArrays(mode, offset, count);
      }
    }
    tick();

    return () => (stop = true);
  }, []);

  return (
    <div className={s("container")}>
      <canvas ref={canvasRef} width={W} height={H} />
    </div>
  );
};
