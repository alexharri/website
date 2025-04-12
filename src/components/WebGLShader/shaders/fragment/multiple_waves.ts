import { noiseUtils } from "../utils/noiseUtils";
import { simplex_noise } from "../utils/simplexNoise";
import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (options) => {
  const { offsetScalar = 1 } = options as { offsetScalar?: number };

  return /* glsl */ `
    precision highp float;

    uniform float u_time;
    uniform float u_h;
    uniform float u_w;

    float WAVE1_HEIGHT = u_h * 0.12;
    float WAVE2_HEIGHT = u_h * 0.16;
    float WAVE1_Y = 0.80 * u_h;
    float WAVE2_Y = 0.35 * u_h;

    ${noiseUtils}
    ${simplex_noise}

    float noise(float x, float offset) {
      const float L = 0.0018;
      const float S = 0.12;
      const float F = 0.043;

      float time = u_time + offset;

      float sum = 0.0;
      sum += simplex_noise(vec2(x * (L / 1.00) + F * time, time * S * 1.00)) * 0.85;
      sum += simplex_noise(vec2(x * (L / 1.30) + F * time, time * S * 1.26)) * 1.15;
      sum += simplex_noise(vec2(x * (L / 1.86) + F * time, time * S * 1.09)) * 0.60;
      sum += simplex_noise(vec2(x * (L / 3.25) + F * time, time * S * 0.89)) * 0.40;
      return sum;
    }

    float wave_alpha(float Y, float wave_height, float offset) {
      float x = gl_FragCoord.x - u_w * 0.5;
      float wave_y = Y + noise(x, offset * ${offsetScalar.toFixed(1)}) * wave_height;
      float dist = wave_y - gl_FragCoord.y;
      float alpha = clamp(0.5 + dist, 0.0, 1.0);
      return alpha;
    }

    void main() {
      vec3 bg_color = vec3(0.102, 0.208, 0.761);
      vec3 w1_color = vec3(0.094, 0.502, 0.910);
      vec3 w2_color = vec3(0.384, 0.827, 0.898);
      
      float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT, 3840.0);
      float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT, 2240.0);

      vec3 color = bg_color;
      color = mix(color, w1_color, w1_alpha);
      color = mix(color, w2_color, w2_alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;
