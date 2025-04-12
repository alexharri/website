import { noiseUtils } from "../utils/noiseUtils";
import { simplex_noise } from "../utils/simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {
    u_pow: {
      label: "Exponent",
      value: 1,
      range: [1, 4],
      step: 0.1,
    },
  };
  const shader = /* glsl */ `
    precision highp float;

    uniform float u_time;
    uniform float u_w;
    uniform float u_h;
    uniform float u_pow;

    const float OFFSET = 3840.0;
    float LOWER_HEIGHT = u_h * 0.44;
    float UPPER_HEIGHT = u_h - LOWER_HEIGHT;
    float BLUR_AMOUNT = UPPER_HEIGHT * 0.333;
    float BOTTOM_PADDING = 0.0;
    float WAVE_HEIGHT = UPPER_HEIGHT * 0.12;
    float WAVE_Y = LOWER_HEIGHT + UPPER_HEIGHT * 0.5;

    ${noiseUtils}
    ${simplex_noise}

    float smoothstep(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    float noise(float x, float offset) {
      const float L = 0.0012;
      const float S = 0.04;
      const float F = 0.031;

      float t = u_time + offset;

      float sum = 0.0;
      sum += simplex_noise(vec2(x * (L / 1.00) + F * t, t * S * 1.00)) * 0.85;
      sum += simplex_noise(vec2(x * (L / 1.30) + F * t, t * S * 1.26)) * 1.15;
      sum += simplex_noise(vec2(x * (L / 1.86) + F * t, t * S * 1.09)) * 0.60;
      sum += simplex_noise(vec2(x * (L / 3.25) + F * t, t * S * 0.89)) * 0.40;
      return sum;
    }

    float calc_blur_t(float offset, float _pow) {
      const float L = 0.0018;
      const float S = 0.1;
      const float F = 0.034;
      
      float x = gl_FragCoord.x;
      float t = u_time + offset;
      float blur_t = (simplex_noise(vec2(x * L + F * t, t * S)) + 1.0) / 2.0;
      blur_t = pow(blur_t, _pow);
      return blur_t;
    }

    float calc_blur(float offset) {
      return mix(1.0, 1.0 + BLUR_AMOUNT, calc_blur_t(offset, u_pow));
    }

    float wave_alpha(float Y, float wave_height, float offset) {
      float x = gl_FragCoord.x - u_w * 0.5;
      float y = gl_FragCoord.y;

      // Calculate distance to curve Y
      float wave_y = Y + noise(x, offset) * wave_height;
      float dist = wave_y - y;
      
      // Calculate alpha
      float blur = calc_blur(offset);
      float alpha = clamp(0.5 + dist / blur, 0.0, 1.0);
      alpha = smoothstep(alpha);
      return alpha;
    }

    vec3 upper_color() {
      vec3 bg_color = vec3(0.102, 0.208, 0.761);
      vec3 w1_color = vec3(0.094, 0.502, 0.910);
      vec3 w2_color = vec3(0.384, 0.827, 0.898);
      
      float w2_alpha = wave_alpha(WAVE_Y, WAVE_HEIGHT, OFFSET);

      vec3 color = bg_color;
      color = mix(color, w2_color, w2_alpha);
      return color;
    }

    vec3 lower_color(float offset) {
      float y = gl_FragCoord.y;
      float blur_t = calc_blur_t(offset, u_pow);
      float blur_t_org = calc_blur_t(offset, 1.0);

      float wave_y_org = BOTTOM_PADDING + blur_t_org * LOWER_HEIGHT;
      float wave_y = BOTTOM_PADDING + blur_t * LOWER_HEIGHT;
      float wave_dist = wave_y - gl_FragCoord.y;
      float wave_dist_org = wave_y_org - gl_FragCoord.y;

      float bottom_dist = BOTTOM_PADDING - gl_FragCoord.y;
      float top_dist = LOWER_HEIGHT - gl_FragCoord.y;

      float w_alpha = (sign(wave_dist) + 1.0) / 2.0;

      float w_org_alpha = 1.0;
      w_org_alpha *= clamp(2.0 + wave_dist_org, 0.0, 1.0);
      w_org_alpha *= clamp(1.0 - wave_dist_org, 0.0, 1.0);

      float b_alpha = 1.0;
      b_alpha *= clamp(1.5 + bottom_dist, 0.0, 1.0);
      b_alpha *= clamp(1.5 - bottom_dist, 0.0, 1.0);

      float t_alpha = 1.0;
      t_alpha *= clamp(1.0 + top_dist, 0.0, 1.0);
      t_alpha *= clamp(1.0 - top_dist, 0.0, 1.0);

      vec3 color = vec3(0.027,0.11,0.2);
      color = mix(color, vec3(0.133,0.416,0.702), w_alpha);
      color = mix(color, vec3(0.2,0.702,0.839), w_org_alpha);
      color = mix(color, vec3(1.0), b_alpha * 0.5);
      color = mix(color, vec3(1.0), t_alpha * 0.5);
      return color;
    }

    void main() {
      float P = 2.0;
      float split_dist = (LOWER_HEIGHT + P * 2.0) - gl_FragCoord.y;

      float t = (sign(split_dist) + 1.0) / 2.0;
      vec3 color = mix(upper_color(), lower_color(OFFSET), t);

      float black_t = 1.0 - (sign(abs(split_dist) - P) + 1.0) / 2.0;
      color = mix(color, vec3(0.0), black_t);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
