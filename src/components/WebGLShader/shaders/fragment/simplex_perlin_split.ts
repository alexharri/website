import { noiseUtils } from "../utils/noiseUtils";
import { simplex_noise } from "../utils/simplexNoise";
import { perlin_noise } from "../utils/perlinNoise";
import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  return /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform float u_w;

    ${noiseUtils}
    ${simplex_noise}
    ${perlin_noise}

    void main() {
      const float L = 0.02;
      const float S = 0.6;
      
      float x = gl_FragCoord.x * L;
      float y = gl_FragCoord.y * L;
      float z = u_time * S;

      const float perlin_L = 0.6;

      float noise_perlin = (perlin_noise(vec3(x, y, z)) + 1.0) / 2.0;
      float noise_simplex = (simplex_noise(vec3(x * perlin_L, y * perlin_L, z * perlin_L)) + 1.0) / 2.0;
      
      float x_dist = u_w * 0.5 - gl_FragCoord.x;
      float noise = mix(noise_simplex, noise_perlin, (sign(x_dist) + 1.0) / 2.0);

      float black_bar_in_middle_fac = (sign(abs(x_dist) - 6.0) + 1.0) / 2.0;
      noise *= black_bar_in_middle_fac;

      gl_FragColor = vec4(vec3(noise), 1.0);
    }
  `;
};

export default createFragmentShader;
