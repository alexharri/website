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
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform float u_w;
    uniform float u_h;
    uniform float u_blur;

    float WAVE1_HEIGHT = u_h * 0.12;
    float WAVE2_HEIGHT = u_h * 0.16;
    float WAVE1_Y = 0.80 * u_h;
    float WAVE2_Y = 0.35 * u_h;

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

    float calc_blur(float offset) {
      const float L = 0.0018;
      const float S = 0.1;
      const float F = 0.034;
      
      float x = gl_FragCoord.x;
      float t = u_time + offset;
      float blur_t = (simplexNoise(vec2(x * L + F * t, t * S)) + 1.0) / 2.0;
      float blur = mix(1.0, 1.0 + u_blur, blur_t);
      return blur;
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

      float smoothing_fac = (sign(u_w / 2.0 - x) + 1.0) / 2.0;
      alpha = mix(alpha, smooth_step(alpha), smoothing_fac);

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

      float center_dist = abs(u_w / 2.0 - gl_FragCoord.x);
      float black_t = 1.0 - (sign(center_dist - 2.0) + 1.0) / 2.0;

      color = mix(color, vec3(0.0), black_t);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
