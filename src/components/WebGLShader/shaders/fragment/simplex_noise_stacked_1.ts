import { noiseUtils } from "../utils/noiseUtils";
import { simplex_noise } from "../utils/simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {
    time2: {
      label: "math:F",
      value: 1,
      range: [1, 5],
      step: 1,
      format: "multiplier",
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform float u_time2;

    ${noiseUtils}
    ${simplex_noise}

    float smoothstep(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    void main() {
      float L = 0.0015;
      float F = 0.11 * u_time2;
      const float S = 0.13;
      const float Y_SCALE = 3.0;
      
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y * Y_SCALE;
      
      const float O1 = 138.0;
      const float O2 = 39.7;
      const float O3 = 258.2;

      float sum = 0.5;
      sum += simplex_noise(vec3(x * L * 1.0 +  F * 1.0, y * L * 1.00, u_time * S + O1)) * 0.30;
      sum += simplex_noise(vec3(x * L * 0.6 + -F * 0.6, y * L * 0.85, u_time * S + O2)) * 0.26;
      sum += simplex_noise(vec3(x * L * 0.4 +  F * 0.8, y * L * 0.70, u_time * S + O3)) * 0.22;
      sum = pow(sum, 1.7);
      sum = clamp(sum, 0.0, 1.0);

      float lightness = clamp(0.0, 1.0, sum);
      gl_FragColor = vec4(lightness, lightness, lightness, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
