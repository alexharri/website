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
    blurAmount = 230,
    blurQuality = 7,
    blurExponentRange = [0.96, 1.15],
    showWaves = true,
  } = options as Partial<{
    blurAmount: number;
    blurQuality: number;
    blurExponentRange: [number, number];
    accentColor: string;
    showWaves: boolean;
  }>;

  const uniforms: FragmentShaderUniforms = {
    u_foo: {
      value: 0,
      range: [0, 1],
    },
  };

  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time; // Time in seconds
    uniform float u_w;
    uniform float u_h;
    uniform float u_foo;
    uniform sampler2D u_gradient;
  
    const float PI = 3.14159, TAU = PI * 2.0;

    const float WAVE1_Y = 0.45, WAVE2_Y = 0.9;
    const float WAVE1_HEIGHT = 48.0, WAVE2_HEIGHT = 36.0;

    const float ACCENT_NOISE_SCALE = 0.4; // Smaller is bigger
  
    float DIV_H = 1.0 / u_h, DIV_W = 1.0 / u_w;
  
    // Imports
    ${noiseUtils}
    ${perlinNoise}
    ${simplexNoise}
  
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
      return clamp(0.5 + dist * u_h / v, 0.0, 1.0);
    }

    float background_noise(float offset) {
      const float NOISE_SPEED = 0.064; // Higher is faster
      const float NOISE_X_SHIFT = 0.04; // Higher is faster

      float time = u_time + offset;
      float x = gl_FragCoord.x * DIV_W, y = gl_FragCoord.y * DIV_H;
      float s1 = 1.5, s2 = 0.9, s3 = 0.6;
      float noise_raw =
        simplexNoise(vec3(x * s1 + time *  NOISE_X_SHIFT * 1.1, y * s1 * 1.00, time * NOISE_SPEED)) * 0.30 +
        simplexNoise(vec3(x * s2 + time * -NOISE_X_SHIFT * 0.6, y * s2 * 0.85, time * NOISE_SPEED)) * 0.25 +
        simplexNoise(vec3(x * s3 + time *  NOISE_X_SHIFT * 0.8, y * s3 * 0.70, time * NOISE_SPEED)) * 0.20 +
        0.5;
      return noise_raw;
    }

    float wave_y_noise(float offset) {
      float s1 = 1.30, s2 = 1.00, s3 = 0.70, s4 = 0.40; // Scale
      float p1 = 0.54, p2 = 0.68, p3 = 0.59, p4 = 0.48; // Phase
      float a1 = 0.85, a2 = 1.15, a3 = 0.60, a4 = 0.40; // Amplitude

      float time = u_time + offset;

      float x = gl_FragCoord.x * DIV_W;
      float y = time * 0.075;
      float x_shift = time * 0.026;
      float noise_raw =
        simplexNoise(vec2(x * s1 + x_shift, y * p1)) * a1 +
        simplexNoise(vec2(x * s2 + x_shift, y * p2)) * a2 +
        simplexNoise(vec2(x * s3 + x_shift, y * p3)) * a3 +
        simplexNoise(vec2(x * s4 + x_shift, y * p4)) * a4 +
        0.0;
      return noise_raw;
    }

    float calc_blur_bias() {
      const float S = 0.3;
      float bias_t = (sin(u_time * S) + 1.0) * 0.5;
      return lerp(-0.23, 0.06, bias_t);
    }

    float calc_blur(float offset) {
      const float L = 0.0011;
      const float S = 0.07;
      const float F = 0.03;
      
      float time = u_time + offset;

      float x = gl_FragCoord.x * L;
      float blur_fac = calc_blur_bias();
      blur_fac += simplexNoise(vec2(x * 0.60 + time * F *  1.0, time * S * 0.7)) * 0.5;
      blur_fac += simplexNoise(vec2(x * 1.30 + time * F * -0.8, time * S * 1.0)) * 0.4;
      blur_fac = clamp((blur_fac + 1.0) * 0.5, 0.0, 1.0);
      return blur_fac;
    }

    float calc_y_dist(float target_y, float offset_px, float offset_fac) {
      target_y += offset_fac * offset_px * DIV_H;
      return target_y - (gl_FragCoord.y * DIV_H);
    }

    float wave_alpha(float Y, float wave_height) {
      float noise_offset = Y * wave_height;
      float blur_fac = calc_blur(noise_offset);

      float y_noise = wave_y_noise(noise_offset);
      float dist = calc_y_dist(Y, wave_height, y_noise);
      
      const int N_PARTS = ${blurQuality};
      const float PART = 1.0 / float(N_PARTS);
      
      float sum = 0.0;
      for (int i = 0; i < N_PARTS; i++) {
        float t = N_PARTS == 1 ? 0.5 : PART * float(i);
        sum += wave_alpha_part(dist, blur_fac, t) * PART;
      }
      return sum;
    }

    vec2 wave1() {
      float alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT);
      float noise = background_noise(420.0);
      return vec2(noise, alpha);
    }
  
    vec2 wave2() {
      float alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT);
      float noise = background_noise(-420.0);
      return vec2(noise, alpha);
    }
  
    float accent_lightness(float off1, float off2) {
      const float NOISE_SPEED = 0.064; // Higher is faster
      const float NOISE_X_SHIFT = 0.04; // Higher is faster
      float x = gl_FragCoord.x * DIV_W, y = gl_FragCoord.y * DIV_H;
      float noise_x = x * ACCENT_NOISE_SCALE;
      float noise_y = y * ACCENT_NOISE_SCALE * 1.0;
      float off3 = off1 - off2;
      float off4 = off1 * off2;
  
      // s1 is smaller than s2
      float s1 = 2.5, s2 = 1.8, s3 = 1.0;
      float noise = -0.0;
      noise += simplexNoise(vec3(noise_x * s1 + u_time *  NOISE_X_SHIFT * 1.2, noise_y * s1 + 0.0, off1 + u_time * NOISE_SPEED)) * 0.7;
      noise += simplexNoise(vec3(noise_x * s2 + u_time * -NOISE_X_SHIFT * 1.5, noise_y * s2 + 0.3, off2 + u_time * NOISE_SPEED)) * 0.5;
      noise += simplexNoise(vec3(noise_x * s3 + u_time *  NOISE_X_SHIFT * 0.8, noise_y * s3 + 0.7, off3 + u_time * NOISE_SPEED)) * 0.4;
      noise += 0.45;
      float t = clamp(noise, 0.0, 1.0);
      t = pow(t, 2.0);
      // t = smooth_step(t);
      t = ease_out(t);
      return t;
    }
  
    vec3 color_from_lightness(float lightness) {
      lightness = clamp(lightness, 0.0, 1.0);
      return vec3(texture2D(u_gradient, vec2(lerp(0.00001, 0.999, lightness), 0.5)));
    }
  
    void main() {
      vec2 w1 = wave1(), w2 = wave2();
      
      float bg_lightness = background_noise(-192.4);
      float w1_lightness = background_noise(273.3);
      float w2_lightness = background_noise(623.1);

      float w1_alpha = wave_alpha(WAVE1_Y, WAVE1_HEIGHT);
      float w2_alpha = wave_alpha(WAVE2_Y, WAVE2_HEIGHT);
  
      vec3 w1_color = color_from_lightness(w1_lightness);
      vec3 w2_color = color_from_lightness(w2_lightness);
      vec3 bg_color = color_from_lightness(bg_lightness);
  
      ${includeif(
        accentColor != null,

        // if we're using an accent color
        () => /* glsl */ `
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

        // Debug viz: alpha mixing
        //
        // bg_color = vec3(1.0, 0.0, 0.0);
        // w1_color = vec3(0.0, 0.0, 1.0);
        // w2_color = vec3(0.0, 1.0, 0.0);
    
        vec3 color = bg_color;
        color = mix(color, w2_color, w2_alpha);
        color = mix(color, w1_color, w1_alpha);
        `,

        // else: we're not using an accent color
        //
        // In this case, we can compute a single lightness value and determine the color for
        // that lightness. We don't need to perform any color blending, so we avoid washed out
        // middle colors (see https://www.joshwcomeau.com/css/make-beautiful-gradients/).
        () => /* glsl */ `
          float lightness = bg_lightness;
          lightness = lerp(lightness, w2_lightness, w2_alpha);
          lightness = lerp(lightness, w1_lightness, w1_alpha);
          vec3 color = color_from_lightness(lightness);
        `,
      )}

      ${includeif(
        !showWaves,
        () => /* glsl */ `
        color = color_from_lightness(bg_lightness);
      `,
      )}
    
      gl_FragColor = vec4(color, 1.0);

      // Debug viz: noise function
      //
      // gl_FragColor = vec4(1.0, 1.0, 1.0, w1_lightness);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
