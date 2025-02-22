import { noiseUtils } from "../../noiseUtils";
import { simplexNoise } from "../../simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_h;
    uniform float u_time;
    uniform sampler2D u_gradient;

    const float WAVE1_HEIGHT = 24.0;
    const float WAVE2_HEIGHT = 32.0;
    float WAVE1_Y = 0.80 * u_h;
    float WAVE2_Y = 0.35 * u_h;

    float PI = ${Math.PI.toFixed(10)};

    ${noiseUtils}
    ${simplexNoise}

    float smooth_step(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    float ease_in(float x)
      { return 1.0 - cos((x * PI) * 0.5); }
    
    float calc_blur(float offset) {
      const float BLUR_AMOUNT = 130.0;
      const float L = 0.0018;
      const float S = 0.1;
      const float F = 0.034;
      
      float x = gl_FragCoord.x;
      float time = u_time + offset;
      float blur_t = (simplexNoise(vec2(x * L + F * time, time * S)) + 1.0) / 2.0;
      blur_t = ease_in(blur_t);
      
      float blur = mix(1.0, 1.0 + BLUR_AMOUNT, blur_t);
      return blur;
    }

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
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;

      // Calculate distance to curve Y
      float noise_offset = Y * wave_height;
      float wave_y = Y + noise(x, noise_offset) * wave_height;
      float dist_signed = wave_y - y;
      
      // Calculate alpha
      float blur = calc_blur(noise_offset);

      float delta = clamp(dist_signed / blur, -0.5, 0.5);
      delta = smooth_step(delta + 0.5) - 0.5;
      
      float alpha = clamp(0.5 + delta, 0.0, 1.0);
      return alpha;
    }
      
    float background_noise(float offset) {
      const float L = 0.0015;
      const float F = 0.11;
      const float S = 0.13;
      const float Y_SCALE = 3.0;
      
      const float O1 = 138.0;
      const float O2 = 39.7;
      const float O3 = 258.2;

      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y * Y_SCALE;

      float time = u_time + offset;
      
      float sum = 0.5; // Start at 50% lightness
      sum += simplexNoise(vec3(x * L * 1.0 +  F * 1.0, y * L * 1.00, time * S + O1)) * 0.30;
      sum += simplexNoise(vec3(x * L * 0.6 + -F * 0.6, y * L * 0.85, time * S + O2)) * 0.26;
      sum += simplexNoise(vec3(x * L * 0.4 +  F * 0.8, y * L * 0.70, time * S + O3)) * 0.22;
      return clamp(sum, 0.0, 1.0);
    }

    void main() {
      float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT);
      float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT);
      
      float bg_lightness = background_noise(0.0);
      float w1_lightness = background_noise(200.0);
      float w2_lightness = background_noise(400.0);

      float lightness = bg_lightness;
      lightness = mix(lightness, w1_lightness, w1_alpha);
      lightness = mix(lightness, w2_lightness, w2_alpha);

      gl_FragColor = texture2D(u_gradient, vec2(lightness, 0.5));
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
