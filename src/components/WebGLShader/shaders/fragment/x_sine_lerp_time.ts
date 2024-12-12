import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (options) => {
  const { waveLength = 1 } = options as { waveLength: number };
  return /* glsl */ `
    precision mediump float;

    uniform float u_time;

    const float WIDTH = 150.0;
    const float to_length = 1.0 / ${(waveLength / (2.0 * Math.PI)).toFixed(1)};

    void main() {
      vec3 red   = vec3(1.0, 0.0, 0.0);
      vec3 blue  = vec3(0.0, 0.0, 1.0);

      float t = sin(gl_FragCoord.x * to_length + u_time * ${Math.PI});
      t = (t + 1.0) * 0.5;

      vec3 color = mix(red, blue, t);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;
