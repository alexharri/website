import { noiseUtils } from "../utils/noiseUtils";
import { simplex_noise } from "../utils/simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (options) => {
  const {
    blurAmount = 345,
    blurQuality = 7,
    blurExponentRange = [0.9, 1.2],
  } = options as Partial<{
    blurAmount: number;
    blurQuality: number;
    blurExponentRange: [number, number];
  }>;

  const uniforms: FragmentShaderUniforms = {};

  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time; // Time in seconds
    uniform float u_h;
    uniform float u_w;
    uniform sampler2D u_gradient;
  
    const float PI = 3.14159;

    float WAVE1_Y = 0.45 * u_h, WAVE2_Y = 0.9 * u_h;
    float WAVE1_HEIGHT = 0.195 * u_h, WAVE2_HEIGHT = 0.144 * u_h;
  
    ${noiseUtils}
    ${simplex_noise}

    float get_x() {
      return 900.0 + gl_FragCoord.x - u_w / 2.0;
    }
  
    // Various utility functions
    float smoothstep(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    float lerp(float a, float b, float t)
      { return a * (1.0 - t) + b * t; }

    float ease_in(float x)
      { return 1.0 - cos((x * PI) * 0.5); }

    float ease_out(float x)
      { return sin((x * PI) * 0.5); }

    float wave_alpha_part(float dist, float blur_fac, float t) {
      float exp = mix(${blurExponentRange[0].toFixed(5)}, ${blurExponentRange[1].toFixed(5)}, t);
      float v = pow(blur_fac, exp);
      v = ease_in(v);
      v = smoothstep(v);
      v = clamp(v, 0.008, 1.0);
      v *= ${blurAmount.toFixed(1)};
      float alpha = clamp(0.5 + dist / v, 0.0, 1.0);
      alpha = smoothstep(alpha);
      return alpha;
    }

    float background_noise(float offset) {
      const float S = 0.064;
      const float L = 0.00085;
      const float L1 = 1.5, L2 = 0.9, L3 = 0.6;
      const float LY1 = 1.00, LY2 = 0.85, LY3 = 0.70;
      const float F = 0.04;
      const float Y_SCALE = 1.0 / 0.27;

      float x = get_x() * L;
      float y = gl_FragCoord.y * L * Y_SCALE;
      float time = u_time + offset;
      float x_shift = time * F;
      float sum = 0.5;
      sum += simplex_noise(vec3(x * L1 +  x_shift * 1.1, y * L1 * LY1, time * S)) * 0.30;
      sum += simplex_noise(vec3(x * L2 + -x_shift * 0.6, y * L2 * LY2, time * S)) * 0.25;
      sum += simplex_noise(vec3(x * L3 +  x_shift * 0.8, y * L3 * LY3, time * S)) * 0.20;
      return sum;
    }

    float wave_y_noise(float offset) {
      const float L = 0.000845;
      const float S = 0.075;
      const float F = 0.026;

      float time = u_time + offset;
      float x = get_x() * 0.000845;
      float y = time * S;
      float x_shift = time * 0.026;

      float sum = 0.0;
      sum += simplex_noise(vec2(x * 1.30 + x_shift, y * 0.54)) * 0.85;
      sum += simplex_noise(vec2(x * 1.00 + x_shift, y * 0.68)) * 1.15;
      sum += simplex_noise(vec2(x * 0.70 + x_shift, y * 0.59)) * 0.60;
      sum += simplex_noise(vec2(x * 0.40 + x_shift, y * 0.48)) * 0.40;
      return sum;
    }

    float calc_blur_bias() {
      const float S = 0.261;
      float bias_t = (sin(u_time * S) + 1.0) * 0.5;
      return lerp(-0.17, -0.04, bias_t);
    }

    float calc_blur(float offset) {
      const float L = 0.0011;
      const float S = 0.07;
      const float F = 0.03;
      
      float time = u_time + offset;

      float x = get_x() * L;
      float blur_fac = calc_blur_bias();
      blur_fac += simplex_noise(vec2(x * 0.60 + time * F *  1.0, time * S * 0.7)) * 0.5;
      blur_fac += simplex_noise(vec2(x * 1.30 + time * F * -0.8, time * S * 1.0)) * 0.4;
      blur_fac = (blur_fac + 1.0) * 0.5;
      blur_fac = clamp(blur_fac, 0.0, 1.0);
      return blur_fac;
    }

    float wave_alpha(float Y, float wave_height, float offset) {
      float wave_y = Y + wave_y_noise(offset) * wave_height;
      float dist_signed = wave_y - gl_FragCoord.y;
      float blur_fac = calc_blur(offset);
      
      const float PART = 1.0 / float(${blurQuality.toFixed(1)});
      float sum = 0.0;
      for (int i = 0; i < ${blurQuality}; i++) {
        float t = ${blurQuality} == 1 ? 0.5 : PART * float(i);
        sum += wave_alpha_part(dist_signed, blur_fac, t) * PART;
      }
      return sum;
    }
  
    vec3 calc_color(float lightness) {
      lightness = clamp(lightness, 0.0, 1.0);
      return vec3(texture2D(u_gradient, vec2(lightness, 0.5)));
    }
  
    void main() {
      float bg_lightness = background_noise(-192.4);
      float w1_lightness = background_noise( 273.3);
      float w2_lightness = background_noise( 623.1);

      float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT, 112.5 * 48.75);
      float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT, 225.0 * 36.00);

      float lightness = bg_lightness;
      lightness = lerp(lightness, w2_lightness, w2_alpha);
      lightness = lerp(lightness, w1_lightness, w1_alpha);

      gl_FragColor = vec4(calc_color(lightness), 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
