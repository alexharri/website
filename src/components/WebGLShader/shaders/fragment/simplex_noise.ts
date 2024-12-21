import { noiseUtils } from "../../noiseUtils";
import { simplexNoise } from "../../simplexNoise";
import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (options) => {
  const {
    xScale = 0.02,
    yScale = 0.02,
    timeScale = 0.6,
  } = options as { xScale?: number; yScale?: number; timeScale?: number };
  return /* glsl */ `
    precision mediump float;

    uniform float u_time;

    ${noiseUtils}
    ${simplexNoise}

    void main() {
      float x = gl_FragCoord.x * ${xScale};
      float y = gl_FragCoord.y * ${yScale};
      float z = u_time * ${timeScale};

      float noise = simplexNoise(vec3(x, y, z));
      float lightness = (noise + 1.0) / 2.0; // Remap from [-1, 1] to [0, 1]

      gl_FragColor = vec4(lightness, lightness, lightness, 1.0);
    }
  `;
};

export default createFragmentShader;
