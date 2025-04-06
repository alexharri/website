import { noiseUtils } from "../utils/noiseUtils";
import { simplex_noise } from "../utils/simplexNoise";
import { perlinNoise } from "../utils/perlinNoise";
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
    uniform float u_w;

    const float CANVAS_HEIGHT = 300.0;

    ${noiseUtils}
    ${simplex_noise}
    ${perlinNoise}

    void main() {
      float x = gl_FragCoord.x * ${xScale};
      float y = gl_FragCoord.y * ${yScale};
      float z = u_time * ${timeScale};

      float S = 0.6;

      float l0 = (perlinNoise(vec3(x, y, z)) + 1.0) / 2.0;
      float l1 = (simplex_noise(vec3(x * S, y * S, z * S)) + 1.0) / 2.0;
      
      float dist = gl_FragCoord.x - u_w * 0.5;
      float t = (sign(dist) + 1.0) / 2.0;
      float l = mix(l0, l1, t);

      float f = (sign(abs(dist) - 6.0) + 1.0) / 2.0;
      l *= f;

      gl_FragColor = vec4(l, l, l, 1.0);
    }
  `;
};

export default createFragmentShader;
