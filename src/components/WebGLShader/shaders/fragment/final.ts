import { lerp } from "../../../../math/lerp";
import { hexToRgb } from "../../../../utils/color";
import { noiseUtils } from "../../noiseUtils";
import { perlinNoise } from "../../perlinNoise";
import { simplexNoise } from "../../simplexNoise";
import { CreateFragmentShader } from "../types";

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
    BLUR_HEIGHT = 230,
    blurQuality = 7,
    blurExponentRange = [0.96, 1.15],
    resolution = [1400, 250],
  } = options as Partial<{
    BLUR_HEIGHT: number;
    blurQuality: number;
    blurExponentRange: [number, number];
    accentColor: string;
    resolution: [number, number];
  }>;

  return /* glsl */ `
    precision mediump float;

    // Uniforms (inputs)
    uniform float u_time; // Time in seconds
    uniform sampler2D u_gradient; // height=1, width=N
  
    // Math constants
    const float PI = 3.14159, TAU = PI * 2.0;

    // Wave config
    const float WAVE1_Y = 0.45,      WAVE2_Y = 0.9; // Proportion of H
    const float WAVE1_HEIGHT = 48.0, WAVE2_HEIGHT = 36.0; // Height in px

    // Accent color config
    const float ACCENT_NOISE_SCALE = 0.4; // Smaller is bigger
  
    // Resolution
    const float W = ${resolution[0].toFixed(1)}, H = ${resolution[1].toFixed(1)};
    const float DIV_H = 1.0 / H, DIV_W = 1.0 / W;
    const vec2 WH = vec2(W, H);
  
    // Imports
    ${noiseUtils}
    ${perlinNoise}
    ${simplexNoise}
  
    float smooth_step(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    float lerp(float a, float b, float t)
      { return a * (1.0 - t) + b * t; }

    float ease_in(float x)
      { return 1.0 - cos((x * PI) * 0.5); }

    float ease_out(float x)
      { return sin((x * PI) * 0.5); }

    float wave_len(float value)
      { return gl_FragCoord.x * 0.02 / value; }
  
    float wave_phase(float phase) {
      const float WAVE_SPEED = 0.8; // Higher is faster
      return phase * u_time * WAVE_SPEED;
    }
  
    float wave_amplitude(float value)
      { return value; }

    float wave_offset(float t)
      { return t * TAU; }
  
    float calc_dist(float wave_y, float wave_height_px, float curve_y_off) {
      float wave_height = wave_height_px * DIV_H;
      float curve_y = wave_y + curve_y_off * wave_height;
      float y = gl_FragCoord.y * DIV_H;
      float dist = curve_y - y;
      return dist;
    }
  
    float alpha_part(float dist, float fac) {
      float dist_sign_pos = (-sign(dist) + 1.0) * 0.5;
      float dist_sign_neg = 1.0 - dist_sign_pos;
  
      float d2 = dist * H / fac;
      float alpha_pos = clamp(0.5 + d2, 0.0, 1.0);
      float alpha_neg = clamp(0.5 - d2, 0.0, 1.0);
      float alpha = alpha_pos * dist_sign_pos + (1.0 - alpha_neg) * dist_sign_neg;
      return alpha;
    }
  
    float calc_alpha(float dist, float blur_fac) {
      ${Array.from({ length: blurQuality })
        .map((_, i) => {
          const varName = `b${i}`;
          const t = blurQuality === 1 ? 0.5 : i / (blurQuality - 1);
          const exp = lerp(blurExponentRange[0], blurExponentRange[1], t);
          return /* glsl */ `
          float ${varName} = pow(blur_fac, ${exp.toFixed(1)});
          ${varName} = ease_in(${varName});
          ${varName} = smooth_step(${varName});
          ${varName} = clamp(${varName}, 0.008, 1.0);
          ${varName} *= ${BLUR_HEIGHT.toFixed(1)};
        `;
        })
        .join("")}

      float b_sum = 0.0;

      ${Array.from({ length: blurQuality })
        .map((_, i) => {
          const varName = `b${i}`;
          return /* glsl */ `
          b_sum += alpha_part(dist, ${varName}) * ${(1 / blurQuality).toFixed(5)};
        `;
        })
        .join("")}
  
      return b_sum;
    }

    float calc_noise_perlin(float off1, float off2) {
      const float NOISE_SCALE = 1.0; // Higher is smaller
      const float NOISE_X_SHIFT = 0.04; // Higher is faster
      const float NOISE_SPEED = 0.084; // Higher is faster
      
      float x = gl_FragCoord.x * DIV_W, y = gl_FragCoord.y * DIV_H;
      float noise_x = x * NOISE_SCALE;
      float noise_y = y * NOISE_SCALE;
      float s1 = 1.4, s2 = 1.0, s3 = 0.8, s4 = 0.4;
      float off3 = off1 - off2;
      float off4 = off1 * off2;
      float noise_raw =
        perlinNoise(vec3(noise_x * s1 + u_time *  NOISE_X_SHIFT * 1.5, noise_y * s1, off1 + u_time * NOISE_SPEED)) * 0.55 +
        perlinNoise(vec3(noise_x * s2 + u_time *  NOISE_X_SHIFT * 0.8, noise_y * s2, off2 + u_time * NOISE_SPEED)) * 0.45 +
        perlinNoise(vec3(noise_x * s3 + u_time * -NOISE_X_SHIFT,       noise_y * s3, off3 + u_time * NOISE_SPEED)) * 0.35 +
        perlinNoise(vec3(noise_x * s4 + u_time *  NOISE_X_SHIFT,       noise_y * s4, off4 + u_time * NOISE_SPEED)) * 0.35 +
        0.5;
      return noise_raw;
    }
  
    float calc_noise_simplex(float off1, float off2) {
      const float NOISE_SPEED = 0.064; // Higher is faster
      const float NOISE_X_SHIFT = 0.04; // Higher is faster
      float x = gl_FragCoord.x * DIV_W, y = gl_FragCoord.y * DIV_H;
      float s1 = 1.5, s2 = 0.9, s3 = 0.6;
      float off3 = off1 - off2;
      float off4 = off1 * off2;
      float noise_raw =
        simplexNoise(vec3(x * s1 + u_time *  NOISE_X_SHIFT * 1.1, y * s1 * 1.00, off1 + u_time * NOISE_SPEED)) * 0.30 +
        simplexNoise(vec3(x * s2 + u_time * -NOISE_X_SHIFT * 0.6, y * s2 * 0.85, off2 + u_time * NOISE_SPEED)) * 0.25 +
        simplexNoise(vec3(x * s3 + u_time *  NOISE_X_SHIFT * 0.8, y * s3 * 0.70, off3 + u_time * NOISE_SPEED)) * 0.20 +
        0.5;
      return noise_raw;
    }

    float calc_noise(float off1, float off2) {
      return calc_noise_simplex(off1, off2);
    }

    float wave_y_noise(float off1, float off2, float len, float evolution, float shift_speed) {
      float off3 = off1 - off2, off4 = off1 * off2;

      float s1 = 1.30, s2 = 1.00, s3 = 0.70, s4 = 0.40; // Scale
      float p1 = 0.54, p2 = 0.68, p3 = 0.59, p4 = 0.48; // Phase
      float a1 = 0.85, a2 = 1.15, a3 = 0.60, a4 = 0.40; // Amplitude

      float x = gl_FragCoord.x * DIV_W * len;
      float y = u_time * evolution;
      float x_shift = u_time * shift_speed;
      float noise_raw =
        simplexNoise(vec2(x * s1 + x_shift, y * p1 + off1)) * a1 +
        simplexNoise(vec2(x * s2 + x_shift, y * p2 + off2)) * a2 +
        simplexNoise(vec2(x * s3 + x_shift, y * p3 + off3)) * a3 +
        simplexNoise(vec2(x * s4 + x_shift, y * p4 + off4)) * a4 +
        0.0;
      return noise_raw;
    }

    float normalize_blur_with_bias(float blur_fac) {
      // A higher bias makes it harder to get sharp lines, while a lower bias makes it easier.
      //
      // Fluctuate between slight positive and negative biases, so that we get periods with
      // long sharp lines, and periods with few sharp lines at all.
      float bias_t = (1.0 + sin(u_time * 0.3)) * 0.5;
      float bias = lerp(0.8, 1.1, bias_t);
      // bias = 1.0;
      
      return (blur_fac + bias) * 0.5;
    }

    float blur_simplex_noise_1D(float off1, float off2, float len, float evolution, float shift_speed) {
      float off3 = off1 - off2, off4 = off1 * off2;

      float s1 = 0.6, s2 = 1.30, s3 = 0.70, s4 = 0.40; // Scale
      float p1 = 0.7, p2 = 1.0, p3 = 0.59, p4 = 0.48; // Phase
      float a1 = 0.5, a2 = 0.4, a3 = 0.3, a4 = 0.40; // Amplitude

      float x = gl_FragCoord.x * DIV_W * len;
      float y = u_time * evolution;
      float x_shift = u_time * shift_speed;
      float blur_fac =
        simplexNoise(vec2(x * s1 + x_shift *  1.0, y * p1 + off1)) * a1 +
        simplexNoise(vec2(x * s2 + x_shift * -0.8, y * p2 + off2)) * a2 +
        // simplexNoise(vec2(x * s3 + x_shift, y * p3 + off3)) * a3 +
        // simplexNoise(vec2(x * s4 + x_shift, y * p4 + off4)) * a4 +
        -0.1;
      return normalize_blur_with_bias(blur_fac);
    }

    float blur_sin_noise_1D(float off1, float off2) {
      float blur_amp = 0.5;
      float speed = 0.8;
      float foo_x = gl_FragCoord.x * 0.02;
      float phase = u_time * 0.8;

      float off3 = off1 - off2;
      float off4 = off2 - off1;
      float off5 = -off2 - off1;

      float blur_fac =
        sin(foo_x / 7.296 + phase *  0.28 + off1 * TAU) * 0.58 * blur_amp +
        sin(foo_x / 4.739 + phase * -0.19 + off2 * TAU) * 0.43 * blur_amp +
        sin(foo_x / 5.973 + phase *  0.15 + off3 * TAU) * 0.54 * blur_amp +
        sin(foo_x / 3.375 + phase * -0.26 + off4 * TAU) * 0.39 * blur_amp +
        sin(foo_x / 6.478 + phase *  0.23 + off5 * TAU) * 0.35 * blur_amp +
        + 0.0;
      return normalize_blur_with_bias(blur_fac);
    }
  
    vec2 wave1() {
      // float y_noise = 0.0;
      // y_noise += sin(wave_len(5.180) + wave_phase(-0.15) + wave_offset(0.3)) * wave_amplitude(0.6);
      // y_noise += sin(wave_len(3.193) + wave_phase( 0.18) + wave_offset(0.2)) * wave_amplitude(0.8);
      // y_noise += sin(wave_len(5.974) + wave_phase( 0.13) + wave_offset(0.0)) * wave_amplitude(0.6);
      // y_noise += sin(wave_len(6.395) + wave_phase(-0.21) + wave_offset(0.7)) * wave_amplitude(0.4);
      // y_noise += sin(wave_len(3.683) + wave_phase( 0.23) + wave_offset(0.5)) * wave_amplitude(0.5);
      
      // // up-down wave
      // y_noise += sin(wave_len(200.0) + wave_phase( 0.092) + wave_offset(0.7)) * wave_amplitude(0.8);
      // y_noise += sin(wave_len(200.0) + wave_phase(-0.136) + wave_offset(0.3)) * wave_amplitude(0.6);
      // y_noise += sin(wave_len(200.0) + wave_phase( 0.118) + wave_offset(0.1)) * wave_amplitude(0.9);
      float y_noise = wave_y_noise(
        -187.8, 154.0,      // Random offsets
         1.0,  0.075,  0.026 // Length, Evolution, X shift
      );

      float blur_fac = blur_simplex_noise_1D(
        -164.8, 386.0,      // Random offsets
         1.0,  0.07,  0.03 // Length, Evolution, X shift
      );
      // float blur_fac = blur_sin_noise_1D(0.9, 0.3);
      
      float dist = calc_dist(WAVE1_Y, WAVE1_HEIGHT, y_noise);
      float alpha = calc_alpha(dist, blur_fac);
      float noise = calc_noise(0.0, 420.0);
      return vec2(noise, alpha);
    }
  
    vec2 wave2() {
      // float sin_sum = 0.0;
      // sin_sum += sin(wave_len(4.410) + wave_phase( 0.149) + wave_offset(0.6)) * wave_amplitude(0.2);
      // sin_sum += sin(wave_len(3.823) + wave_phase(-0.140) + wave_offset(0.4)) * wave_amplitude(0.7);
      // sin_sum += sin(wave_len(4.274) + wave_phase( 0.173) + wave_offset(0.9)) * wave_amplitude(0.5);
      // sin_sum += sin(wave_len(3.815) + wave_phase(-0.212) + wave_offset(0.2)) * wave_amplitude(0.8);
      // sin_sum += sin(wave_len(3.183) + wave_phase( 0.218) + wave_offset(0.1)) * wave_amplitude(0.4);
      float y_noise = wave_y_noise(
        -262.8, -185.2,     // Random offsets
         1.0,  0.075,  0.026 // Length, Evolution, X shift
      );

      float blur_fac = blur_simplex_noise_1D(
        51.8, -85.0,      // Random offsets
        1.0,  0.07,  0.03 // Length, Evolution, X shift
      );
      // float blur_fac = blur_sin_noise_1D(2.3, -1.7);
  
      float dist = calc_dist(WAVE2_Y, WAVE2_HEIGHT, y_noise);
      float alpha = calc_alpha(dist, blur_fac);
      float noise = calc_noise(-100.0, -420.0);
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
      
      float bg_lightness = calc_noise(182.0, 795.0);;
      float w1_lightness = w1.x, w1_alpha = w1.y;
      float w2_lightness = w2.x, w2_alpha = w2.y;
  
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
    
      gl_FragColor = vec4(color, 1.0);

      // Debug viz: noise function
      //
      // gl_FragColor = vec4(1.0, 1.0, 1.0, w1_lightness);
    }
  `;
};

export default createFragmentShader;
