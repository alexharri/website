import { noiseUtils } from "../../noiseUtils";
import { simplexNoise } from "../../simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {
    u_L: {
      value: 1,
      range: [0.5, 3],
      label: "math:L",
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform float u_L;

    ${noiseUtils}
    ${simplexNoise}

    float smooth_step(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    void main() {
      const float S = 0.13;
      const float F = 0.11;
      const float Y_SCALE = 3.0;
      float L = 0.001513 * u_L;
      
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;
      float z = u_time * S;
      
      float L1 = L * 1.0;
      float L2 = L * 0.6;
      float L3 = L * 0.4;

      float F1 = u_time *  F * 1.0;
      float F2 = u_time * -F * 0.6;
      float F3 = u_time *  F * 0.8;

      float L1Y = L * Y_SCALE * 1.00;
      float L2Y = L * Y_SCALE * 0.85;
      float L3Y = L * Y_SCALE * 0.70;

      const float O1 = 138.0;
      const float O2 = 39.7;
      const float O3 = 258.2;

      const float A1 = 0.30;
      const float A2 = 0.26;
      const float A3 = 0.22;

      float sum = 0.5; // Start at 50% lightness
      sum += simplexNoise(vec3(x * L1 + F1, y * L1Y, u_time * S + O1)) * A1;
      sum += simplexNoise(vec3(x * L2 + F2, y * L2Y, u_time * S + O2)) * A2;
      sum += simplexNoise(vec3(x * L3 + F3, y * L3Y, u_time * S + O3)) * A3;
      sum = pow(sum, 1.7);

      float lightness = clamp(0.0, 1.0, sum);
      gl_FragColor = vec4(lightness, lightness, lightness, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
