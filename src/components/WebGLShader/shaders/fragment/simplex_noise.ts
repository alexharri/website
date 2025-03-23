import { noiseUtils } from "../../noiseUtils";
import { simplexNoise } from "../../simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (options) => {
  const {
    L = 0.02,
    yScale = 1,
    timeScale = 0.6,
  } = options as { L?: number; yScale?: number; timeScale?: number };
  const uniforms: FragmentShaderUniforms = {
    u_L: {
      label: "math:L",
      value: 1,
      range: [1, 4],
      format: "multiplier",
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform float u_L;
    uniform float u_w;
    uniform float u_h;

    ${noiseUtils}
    ${simplexNoise}

    void main() {
      float L = ${L.toFixed(5)} * u_L;

      float x = (gl_FragCoord.x - (u_w * 0.5)) * L;
      float y = (gl_FragCoord.y - (u_h * 0.5)) * L * ${yScale.toFixed(5)};
      float z = u_time * ${timeScale};

      float noise = simplexNoise(vec3(x, y, z));
      float lightness = (noise + 1.0) / 2.0; // Remap from [-1, 1] to [0, 1]

      gl_FragColor = vec4(lightness, lightness, lightness, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
