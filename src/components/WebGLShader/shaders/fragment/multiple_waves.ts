import { noiseUtils } from "../../noiseUtils";
import { simplexNoise } from "../../simplexNoise";
import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (options) => {
  const { offsetScalar = 1 } = options as { offsetScalar?: number };

  return /* glsl */ `
    precision mediump float;

    uniform float u_time;

    const float HEIGHT = 200.0;
    const float WAVE1_HEIGHT = 24.0;
    const float WAVE2_HEIGHT = 32.0;
    const float WAVE1_Y = 0.80 * HEIGHT;
    const float WAVE2_Y = 0.35 * HEIGHT;

    ${noiseUtils}
    ${simplexNoise}

    float noise(float x, float offset) {
      const float L = 0.0012;
      const float S = 0.04;
      const float F = 0.031;

      float t = u_time + offset;

      float sum = 0.0;
      sum += simplexNoise(vec2(x * (L / 1.00) + F * t, t * S * 1.00)) * 0.85;
      sum += simplexNoise(vec2(x * (L / 1.30) + F * t, t * S * 1.26)) * 1.15;
      sum += simplexNoise(vec2(x * (L / 1.86) + F * t, t * S * 1.09)) * 0.60;
      sum += simplexNoise(vec2(x * (L / 3.25) + F * t, t * S * 0.89)) * 0.40;
      return sum;
    }

    float wave_alpha(float Y, float wave_height) {
      float noise_offset = Y * wave_height * ${offsetScalar.toFixed(1)};
      float wave_y = Y + noise(gl_FragCoord.x, noise_offset) * wave_height;
      float dist_signed = wave_y - gl_FragCoord.y;
      float alpha = clamp(0.5 + dist_signed, 0.0, 1.0);
      return alpha;
    }

    void main() {
      vec3 bg_color = vec3(0.102, 0.208, 0.761);
      vec3 w1_color = vec3(0.094, 0.502, 0.910);
      vec3 w2_color = vec3(0.384, 0.827, 0.898);
      
      float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT);
      float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT);

      vec3 color = bg_color;
      color = mix(color, w1_color, w1_alpha);
      color = mix(color, w2_color, w2_alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;