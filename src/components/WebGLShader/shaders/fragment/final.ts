import { hexToRgb } from "../../../../utils/color";
import { noiseUtils } from "../../noiseUtils";
import { perlinNoise } from "../../perlinNoise";
import { simplexNoise } from "../../simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

function hexToVec3(hex: string) {
  const rgb = hexToRgb(hex);
  return `vec3(${rgb.map((n) => (n / 255).toFixed(1)).join(", ")})`;
}

function includeif(
  condition: boolean,
  ifContent: () => string,
  elseContent?: () => string,
): string {
  if (condition) return ifContent();
  if (elseContent) return elseContent();
  return "";
}

const createFragmentShader: CreateFragmentShader = (options) => {
  const {
    accentColor,
    blurAmount = 345,
    blurQuality = 7,
    blurExponentRange = [0.9, 1.2],
    blackAndWhite = false,
  } = options as Partial<{
    blurAmount: number;
    blurQuality: number;
    blurExponentRange: [number, number];
    accentColor: string;
    blackAndWhite: boolean;
  }>;

  const uniforms: FragmentShaderUniforms = {};

  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time; // Time in seconds
    uniform float u_h;
    uniform float u_w;
    uniform sampler2D u_gradient;
  
    const float PI = 3.14159, TAU = PI * 2.0;

    float WAVE1_Y = 0.45 * u_h, WAVE2_Y = 0.9 * u_h;
    float WAVE1_HEIGHT = 0.195 * u_h, WAVE2_HEIGHT = 0.144 * u_h;

    const float ACCENT_NOISE_SCALE = 0.4; // Smaller is bigger
  
    // Imports
    ${noiseUtils}
    ${perlinNoise}
    ${simplexNoise}

    float get_x() {
      return 900.0 + gl_FragCoord.x - u_w / 2.0;
    }
  
    // Various utility functions
    float smooth_step(float t)
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
      v = smooth_step(v);
      v = clamp(v, 0.008, 1.0);
      v *= ${blurAmount.toFixed(1)};
      float alpha = clamp(0.5 + dist / v, 0.0, 1.0);
      alpha = smooth_step(alpha);
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
      sum += simplexNoise(vec3(x * L1 +  x_shift * 1.1, y * L1 * LY1, time * S)) * 0.30;
      sum += simplexNoise(vec3(x * L2 + -x_shift * 0.6, y * L2 * LY2, time * S)) * 0.25;
      sum += simplexNoise(vec3(x * L3 +  x_shift * 0.8, y * L3 * LY3, time * S)) * 0.20;
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
      sum += simplexNoise(vec2(x * 1.30 + x_shift, y * 0.54)) * 0.85;
      sum += simplexNoise(vec2(x * 1.00 + x_shift, y * 0.68)) * 1.15;
      sum += simplexNoise(vec2(x * 0.70 + x_shift, y * 0.59)) * 0.60;
      sum += simplexNoise(vec2(x * 0.40 + x_shift, y * 0.48)) * 0.40;
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
      blur_fac += simplexNoise(vec2(x * 0.60 + time * F *  1.0, time * S * 0.7)) * 0.5;
      blur_fac += simplexNoise(vec2(x * 1.30 + time * F * -0.8, time * S * 1.0)) * 0.4;
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
  
    float accent_lightness(float offset) {
      const float S = 0.064;
      const float F = 0.04;
      float x = get_x() * 0.001;
      float y = gl_FragCoord.y * 0.001;
      float noise_x = x * ACCENT_NOISE_SCALE;
      float noise_y = y * ACCENT_NOISE_SCALE * 1.0;

      float time = u_time + offset;
  
      // s1 is smaller than s2
      float s1 = 2.5, s2 = 1.8, s3 = 1.0;
      float noise = -0.0;
      noise += simplexNoise(vec3(noise_x * s1 + time *  F * 1.2, noise_y * s1 + 0.0, time * S)) * 0.7;
      noise += simplexNoise(vec3(noise_x * s2 + time * -F * 1.5, noise_y * s2 + 0.3, time * S)) * 0.5;
      noise += simplexNoise(vec3(noise_x * s3 + time *  F * 0.8, noise_y * s3 + 0.7, time * S)) * 0.4;
      noise += 0.45;
      float t = clamp(noise, 0.0, 1.0);
      t = pow(t, 2.0);
      t = ease_out(t);
      return t;
    }
  
    vec3 color_from_lightness(float lightness) {
      lightness = clamp(lightness, 0.0, 1.0);
      return vec3(texture2D(u_gradient, vec2(lerp(0.00001, 0.999, lightness), 0.5)));
    }
  
    void main() {
      float bg_lightness = background_noise(-192.4);
      float w1_lightness = background_noise( 273.3);
      float w2_lightness = background_noise( 623.1);

      float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT, 112.5 * 48.75);
      float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT, 225.0 * 36.00);

      ${includeif(
        accentColor != null,

        // if we're using an accent color
        () => /* glsl */ `
      vec3 w1_color = color_from_lightness(w1_lightness);
      vec3 w2_color = color_from_lightness(w2_lightness);
      vec3 bg_color = color_from_lightness(bg_lightness);

      float bg_accent_color_blend_fac = accent_lightness(-397.2,   64.2);
      float w1_accent_color_blend_fac = accent_lightness( 163.2, -512.3);
      float w2_accent_color_blend_fac = accent_lightness( 433.2,  127.9);
  
      bg_accent_color_blend_fac = clamp(bg_accent_color_blend_fac - pow(bg_lightness, 2.0), 0.0, 1.0);
      w1_accent_color_blend_fac = clamp(w1_accent_color_blend_fac - pow(w1_lightness, 2.0), 0.0, 1.0);
      w2_accent_color_blend_fac = clamp(w2_accent_color_blend_fac - pow(w2_lightness, 2.0), 0.0, 1.0);
  
      vec3 accent_color = ${hexToVec3(accentColor!)};
      bg_color = mix(bg_color, accent_color, bg_accent_color_blend_fac);
      w1_color = mix(w1_color, accent_color, w1_accent_color_blend_fac);
      w2_color = mix(w2_color, accent_color, w2_accent_color_blend_fac);
  
      vec3 color = bg_color;
      color = mix(color, w2_color, w2_alpha);
      color = mix(color, w1_color, w1_alpha);
        `,

        // else (we're not using an accent color)
        //
        // In this case, we can compute a single lightness value and determine the color for
        // that lightness. We don't need to perform any color blending, so we avoid washed out
        // middle colors (see https://www.joshwcomeau.com/css/make-beautiful-gradients/).
        () => /* glsl */ `
      float lightness = bg_lightness;
      lightness = lerp(lightness, w2_lightness, w2_alpha);
      lightness = lerp(lightness, w1_lightness, w1_alpha);
      ${includeif(
        blackAndWhite,
        () => /* glsl */ `vec3 color = vec3(lightness);`,
        () => /* glsl */ `vec3 color = color_from_lightness(lightness);`,
      )}
        `,
      )}
    
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
