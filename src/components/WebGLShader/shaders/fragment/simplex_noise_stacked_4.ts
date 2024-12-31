import { noiseUtils } from "../../noiseUtils";
import { simplexNoise } from "../../simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform sampler2D u_gradient;

    ${noiseUtils}
    ${simplexNoise}

    float smooth_step(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    void main() {
      float L = 0.0015;
      const float F = 0.11;
      const float S = 0.13;
      const float Y_SCALE = 3.0;

      vec3 red  = vec3(1.0, 0.0, 0.0);
      vec3 blue = vec3(0.0, 0.0, 1.0);
      
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y * Y_SCALE;
      
      const float O1 = 138.0;
      const float O2 = 39.7;
      const float O3 = 258.2;

      float sum = 0.5; // Start at 50% lightness
      sum += simplexNoise(vec3(x * L * 1.0 +  F * 1.0, y * L * 1.00, u_time * S + O1)) * 0.30;
      sum += simplexNoise(vec3(x * L * 0.6 + -F * 0.6, y * L * 0.85, u_time * S + O2)) * 0.26;
      sum += simplexNoise(vec3(x * L * 0.4 +  F * 0.8, y * L * 0.70, u_time * S + O3)) * 0.22;

      float t = clamp(sum, 0.0, 1.0);
      gl_FragColor = texture2D(u_gradient, vec2(t, 0.5));
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
