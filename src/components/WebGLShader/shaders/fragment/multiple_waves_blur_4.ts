import { noiseUtils } from "../../noiseUtils";
import { simplexNoise } from "../../simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {
    u_blur: {
      label: "Blur amount",
      value: 50,
      range: [0, 100],
    },
    u_pow: {
      label: "Pow",
      value: 1,
      range: [1, 4],
      step: 0.1,
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform float u_w;
    uniform float u_h;
    uniform float u_blur;
    uniform float u_pow;

    const float LOWER_HEIGHT = 140.0;
    const float BOTTOM_PADDING = 0.0;
    const float WAVE_HEIGHT = 24.0;
    float WAVE_Y = 0.80 * u_h;

    ${noiseUtils}
    ${simplexNoise}

    float smooth_step(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    float PI = ${Math.PI.toFixed(10)};

    float ease_in(float x)
      { return 1.0 - cos((x * PI) * 0.5); }

    float ease_out(float x)
      { return sin((x * PI) * 0.5); }

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

    float calc_blur_t(float offset, float _pow) {
      const float L = 0.0018;
      const float S = 0.1;
      const float F = 0.034;
      
      float x = gl_FragCoord.x;
      float t = u_time + offset;
      float blur_t = (simplexNoise(vec2(x * L + F * t, t * S)) + 1.0) / 2.0;
      blur_t = pow(blur_t, _pow);
      return blur_t;
    }

    float calc_blur(float offset) {
      return mix(1.0, 1.0 + u_blur, calc_blur_t(offset, u_pow));
    }

    float wave_alpha(float Y, float wave_height) {
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;

      // Calculate distance to curve Y
      float noise_offset = Y * wave_height;
      float wave_y = Y + noise(x, noise_offset) * wave_height;
      float dist_signed = wave_y - y;
      
      // Calculate alpha
      float blur = calc_blur(noise_offset);
      float alpha = clamp(0.5 + dist_signed / blur, 0.0, 1.0);
      alpha = smooth_step(alpha);
      return alpha;
    }

    vec3 upper_color() {
      vec3 bg_color = vec3(0.102, 0.208, 0.761);
      vec3 w1_color = vec3(0.094, 0.502, 0.910);
      vec3 w2_color = vec3(0.384, 0.827, 0.898);
      
      float w2_alpha = wave_alpha(WAVE_Y, WAVE_HEIGHT);

      vec3 color = w1_color;
      color = mix(color, w2_color, w2_alpha);
      return color;
    }

    vec3 lower_color() {
      float y = gl_FragCoord.y;
      float noise_offset = WAVE_Y * WAVE_HEIGHT;
      float blur_t = calc_blur_t(noise_offset, u_pow);
      float blur_t_org = calc_blur_t(noise_offset, 1.0);

      float wave_y_org = BOTTOM_PADDING + blur_t_org * LOWER_HEIGHT;
      float wave_y = BOTTOM_PADDING + blur_t * LOWER_HEIGHT;
      float wave_dist_signed = wave_y - gl_FragCoord.y;
      float wave_dist_signed_org = wave_y_org - gl_FragCoord.y;

      float bottom_dist_signed = BOTTOM_PADDING - gl_FragCoord.y;
      float top_dist_signed = LOWER_HEIGHT - gl_FragCoord.y;

      float w_alpha = (sign(wave_dist_signed) + 1.0) / 2.0;

      float w_org_alpha = 1.0;
      w_org_alpha *= clamp(2.0 + wave_dist_signed_org, 0.0, 1.0);
      w_org_alpha *= clamp(1.0 - wave_dist_signed_org, 0.0, 1.0);

      float b_alpha = 1.0;
      b_alpha *= clamp(1.5 + bottom_dist_signed, 0.0, 1.0);
      b_alpha *= clamp(1.5 - bottom_dist_signed, 0.0, 1.0);

      float t_alpha = 1.0;
      t_alpha *= clamp(1.0 + top_dist_signed, 0.0, 1.0);
      t_alpha *= clamp(1.0 - top_dist_signed, 0.0, 1.0);

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
      vec3 color = mix(upper_color(), lower_color(), t);

      float black_t = 1.0 - (sign(abs(split_dist) - P) + 1.0) / 2.0;
      color = mix(color, vec3(0.0), black_t);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
