import { noiseUtils } from "../utils/noiseUtils";
import { simplex_noise } from "../utils/simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision highp float;

    uniform float u_time;

    ${noiseUtils}
    ${simplex_noise}

    void main() {
      float L = 0.0015;
      const float F = 0.11;
      const float S = 0.13;
      const float Y_SCALE = 3.0;

      vec3 red  = vec3(1.0, 0.0, 0.0);
      vec3 blue = vec3(0.0, 0.0, 1.0);
      
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y * Y_SCALE;

      float sum = 0.5;
      sum += simplex_noise(vec3(x * L * 1.0 +  F * 1.0, y * L * 1.00, u_time * S)) * 0.26;
      sum += simplex_noise(vec3(x * L * 0.6 + -F * 0.6, y * L * 0.85, u_time * S)) * 0.24;
      sum += simplex_noise(vec3(x * L * 0.4 +  F * 0.8, y * L * 0.70, u_time * S)) * 0.19;

      float t = clamp(sum, 0.0, 1.0);
      vec3 color = mix(blue, red, t);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
