import { hexToRgb } from "../../utils/color";
import { perlinNoise } from "./noise";

export const vertexShader = /* glsl */ `
  precision mediump float;
  attribute vec2 a_position;

  uniform vec2 u_resolution;
  
  void main() {
    vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

function hexToVec3(hex: string) {
  const rgb = hexToRgb(hex);
  return `vec3(${rgb.map((n) => (n / 255).toFixed(1)).join(", ")})`;
}

interface Options {
  accentColor?: string | null;
  constants?: {
    BLUR_HEIGHT?: number;
  };
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

export function createFragmentShader(options: Options) {
  const { BLUR_HEIGHT = 230 } = options.constants ?? {};

  return /* glsl */ `
    precision mediump float;
  
    const float PI = 3.14159;
    const float TAU = PI * 2.0;
    const float WAVE1_HEIGHT = 40.0; // Height in px
    const float WAVE1_Y = 0.45; // From 0 to 1
    const float WAVE2_HEIGHT = 30.0; // Height in px
    const float WAVE2_Y = 0.9; // From 0 to 1
    const float WAVE_AMPLITUDE_SCALE = 1.2;
    const float BLUR_AMPLITUDE_SCALE = 0.5;
    const float BLUR_HEIGHT = ${BLUR_HEIGHT.toFixed(1)};
    const float WAVE_SPEED = 0.8; // Higher is faster
    const float NOISE_SPEED = 0.084; // Higher is faster
    const float NOISE_SCALE = 1.0; // Higher is smaller
    const float ACCENT_NOISE_SCALE = 1.0; // Smaller is bigger
    const float NOISE_X_SHIFT = 0.04; // Higher is faster
  
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform sampler2D u_gradient; // height=1, width=N
  
    float W = u_resolution.x;
    float H = u_resolution.y;

    float wave_phase_multiplier = u_time * WAVE_SPEED;
  
    ${perlinNoise}
  
    float smoothstep(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }
      
    float lerp(float a, float b, float t)
      { return a * (1.0 - t) + b * t; }

    float ease_in(float x)
      { return 1.0 - cos((x * PI) / 2.0); }

    float ease_out(float x)
      { return sin((x * PI) / 2.0); }

    float wave_len(float value)
      { return gl_FragCoord.x * 0.02 / value; }
  
    float wave_phase(float phase)
      { return phase * wave_phase_multiplier; }
  
    float wave_amplitude(float value)
      { return value * WAVE_AMPLITUDE_SCALE; }

    float wave_offset(float t)
      { return t * TAU; }
  
    float blur_amp(float value)
      { return value * BLUR_AMPLITUDE_SCALE; }
  
    float calc_dist(float wave_y, float wave_height_px, float curve_y_off) {
      float wave_height = wave_height_px / H;
      float curve_y = wave_y + curve_y_off * wave_height;
      float y = gl_FragCoord.y / u_resolution.y;
      float dist = curve_y - y;
      return dist;
    }
  
    float alpha_part(float dist, float fac) {
      float dist_sign_pos = (-sign(dist) + 1.0) * 0.5;
      float dist_sign_neg = 1.0 - dist_sign_pos;
  
      float d2 = dist * u_resolution.y / fac;
      float alpha_pos = clamp(0.5 + d2, 0.0, 1.0);
      float alpha_neg = clamp(0.5 - d2, 0.0, 1.0);
      float alpha = alpha_pos * dist_sign_pos + (1.0 - alpha_neg) * dist_sign_neg;
      return alpha;
    }
  
    float calc_alpha(float dist, float blur_sin_sum) {
      // A higher bias makes it harder to get sharp lines, while a lower bias makes it easier.
      //
      // Fluctuate between slight positive and negative biases, so that we get periods with
      // long sharp lines, and periods with few sharp lines at all.
      float bias_t = (1.0 + sin(u_time * 0.3)) * 0.5;
      float bias = lerp(0.8, 1.1, bias_t);
      
      float blur_fac = (blur_sin_sum + bias) * 0.5;
  
      float BLEED = 0.15;
      float b1 = pow(blur_fac, 1.0 + BLEED * 1.0);
      float b2 = pow(blur_fac, 1.0 + BLEED * 0.6);
      float b3 = pow(blur_fac, 1.0 + BLEED * 0.4);
      float b4 = pow(blur_fac, 1.0 + BLEED * 0.0);
      float b5 = pow(blur_fac, 1.0 - BLEED * 0.1);
      float b6 = pow(blur_fac, 1.0 - BLEED * 0.25);
  
      b1 = ease_in(b1);
      b2 = ease_in(b2);
      b3 = ease_in(b3);
      b4 = ease_in(b4);
      b5 = ease_in(b5);
      b6 = ease_in(b6);
  
      b1 = smoothstep(b1);
      b2 = smoothstep(b2);
      b3 = smoothstep(b3);
      b4 = smoothstep(b4);
      b5 = smoothstep(b5);
      b6 = smoothstep(b6);
  
      b1 = clamp(b1, 0.005, 1.0);
      b2 = clamp(b2, 0.005, 1.0);
      b3 = clamp(b3, 0.005, 1.0);
      b4 = clamp(b4, 0.005, 1.0);
      b5 = clamp(b5, 0.005, 1.0);
      b6 = clamp(b6, 0.005, 1.0);
  
      float b1_fac = b1 * BLUR_HEIGHT;
      float b2_fac = b2 * BLUR_HEIGHT;
      float b3_fac = b3 * BLUR_HEIGHT;
      float b4_fac = b4 * BLUR_HEIGHT;
      float b5_fac = b5 * BLUR_HEIGHT;
      float b6_fac = b6 * BLUR_HEIGHT;
  
      float dist_sign_pos = (-sign(dist) + 1.0) * 0.5;
      float dist_sign_neg = 1.0 - dist_sign_pos;
  
      float N = 6.0;
      return
        alpha_part(dist, b1_fac) / N +
        alpha_part(dist, b2_fac) / N +
        alpha_part(dist, b3_fac) / N +
        alpha_part(dist, b4_fac) / N +
        alpha_part(dist, b5_fac) / N +
        alpha_part(dist, b6_fac) / N +
        0.0;
    }
  
    float calc_noise(float off1, float off2) {
      vec2 xy = gl_FragCoord.xy / u_resolution.xy;
      float noise_x = xy.x * NOISE_SCALE;
      float noise_y = xy.y * NOISE_SCALE;
      float s1 = 1.4, s2 = 1.0, s3 = 0.8, s4 = 0.4;
      float off3 = off1 - off2;
      float off4 = off1 * off2;
      float noise_raw =
        perlinNoise(vec3(noise_x * s1 + u_time * NOISE_X_SHIFT * 1.5, noise_y * s1, off1 + u_time * NOISE_SPEED)) * 0.55 +
        perlinNoise(vec3(noise_x * s2 + u_time * NOISE_X_SHIFT * 0.8, noise_y * s2, off2 + u_time * NOISE_SPEED)) * 0.45 +
        perlinNoise(vec3(noise_x * s3 + u_time * -NOISE_X_SHIFT, noise_y * s3, off3 + u_time * NOISE_SPEED)) * 0.35 +
        perlinNoise(vec3(noise_x * s4 + u_time * NOISE_X_SHIFT, noise_y * s4, off4 + u_time * NOISE_SPEED)) * 0.35 +
        0.5;
      return noise_raw;
    }
  
    vec2 wave1() {
      float sin_sum = 0.0;
      sin_sum += sin(wave_len(5.180) + wave_phase(-0.15) + wave_offset(0.3)) * wave_amplitude(0.6);
      sin_sum += sin(wave_len(3.193) + wave_phase( 0.18) + wave_offset(0.2)) * wave_amplitude(0.8);
      sin_sum += sin(wave_len(5.974) + wave_phase( 0.13) + wave_offset(0.0)) * wave_amplitude(0.6);
      sin_sum += sin(wave_len(6.395) + wave_phase(-0.21) + wave_offset(0.7)) * wave_amplitude(0.4);
      sin_sum += sin(wave_len(3.683) + wave_phase( 0.23) + wave_offset(0.5)) * wave_amplitude(0.5);
      
      // up-down wave
      sin_sum += sin(wave_len(200.0) + wave_phase( 0.092) + wave_offset(0.7)) * wave_amplitude(0.8);
      sin_sum += sin(wave_len(200.0) + wave_phase(-0.136) + wave_offset(0.3)) * wave_amplitude(0.6);
      sin_sum += sin(wave_len(200.0) + wave_phase( 0.118) + wave_offset(0.1)) * wave_amplitude(0.9);
      
      float blur_sin_sum = 0.0;
      blur_sin_sum += sin(wave_len( 7.296) + wave_phase( 0.28) + wave_offset(0.1)) * blur_amp(0.58);
      blur_sin_sum += sin(wave_len( 4.739) + wave_phase(-0.19) + wave_offset(0.9)) * blur_amp(0.43);
      blur_sin_sum += sin(wave_len( 5.973) + wave_phase( 0.15) + wave_offset(0.4)) * blur_amp(0.54);
      blur_sin_sum += sin(wave_len( 3.375) + wave_phase(-0.26) + wave_offset(0.3)) * blur_amp(0.39);
      blur_sin_sum += sin(wave_len( 6.478) + wave_phase( 0.23) + wave_offset(0.8)) * blur_amp(0.35);
      
      float dist = calc_dist(WAVE1_Y, WAVE1_HEIGHT, sin_sum);
      float alpha = calc_alpha(dist, blur_sin_sum);
      float noise = calc_noise(0.0, 420.0);
      return vec2(noise, alpha);
    }
  
    vec2 wave2() {
      float sin_sum = 0.0;
      sin_sum += sin(wave_len(4.410) + wave_phase( 0.149) + wave_offset(0.6)) * wave_amplitude(0.2);
      sin_sum += sin(wave_len(3.823) + wave_phase(-0.140) + wave_offset(0.4)) * wave_amplitude(0.7);
      sin_sum += sin(wave_len(4.274) + wave_phase( 0.173) + wave_offset(0.9)) * wave_amplitude(0.5);
      sin_sum += sin(wave_len(3.815) + wave_phase(-0.212) + wave_offset(0.2)) * wave_amplitude(0.8);
      sin_sum += sin(wave_len(3.183) + wave_phase( 0.218) + wave_offset(0.1)) * wave_amplitude(0.4);
      
      float blur_sin_sum = 0.0;
      blur_sin_sum += sin(wave_len(3.539) + wave_phase(-0.175) + wave_offset(0.2)) * blur_amp(0.4);
      blur_sin_sum += sin(wave_len(4.232) + wave_phase( 0.113) + wave_offset(0.5)) * blur_amp(0.7);
      blur_sin_sum += sin(wave_len(2.893) + wave_phase( 0.142) + wave_offset(0.8)) * blur_amp(0.5);
      blur_sin_sum += sin(wave_len(3.972) + wave_phase(-0.127) + wave_offset(0.3)) * blur_amp(0.2);
      blur_sin_sum += sin(wave_len(4.389) + wave_phase( 0.134) + wave_offset(0.1)) * blur_amp(0.5);
  
      float dist = calc_dist(WAVE2_Y, WAVE2_HEIGHT, sin_sum);
      float alpha = calc_alpha(dist, blur_sin_sum);
      float noise = calc_noise(-100.0, -420.0);
      return vec2(noise, alpha);
    }
  
    float calc_bg_lightness() {
      vec2 xy = gl_FragCoord.xy / u_resolution.xy;
      float noise_x = xy.x * NOISE_SCALE + u_time * NOISE_X_SHIFT;
      float noise_y = xy.y * NOISE_SCALE * 0.5;
  
      float s1 = 2.0, s2 = 1.0, s3 = 0.5;
      return
        0.5 + 
        perlinNoise(vec3(noise_x * s1, noise_y * s1 + 0.0, -256.0 + u_time * NOISE_SPEED)) * 0.4 +
        perlinNoise(vec3(noise_x * s2, noise_y * s2 + 0.3, -532.0 + u_time * NOISE_SPEED)) * 0.3 +
        perlinNoise(vec3(noise_x * s3, noise_y * s3 + 0.8, -192.0 + u_time * NOISE_SPEED)) * 0.2;
    }
  
    float accent_lightness(float off1, float off2) {
      vec2 xy = gl_FragCoord.xy / u_resolution.xy;
      float noise_x = xy.x * ACCENT_NOISE_SCALE;
      float noise_y = xy.y * ACCENT_NOISE_SCALE * 1.0;
      float off3 = off1 - off2;
      float off4 = off1 * off2;
  
      // s1 is smaller than s2
      float s1 = 2.5, s2 = 1.8, s3 = 1.0;
      float noise = -0.0;
      noise += perlinNoise(vec3(noise_x * s1 + u_time * NOISE_X_SHIFT * 1.2, noise_y * s1 + 0.0, off1 + u_time * NOISE_SPEED)) * 0.7;
      noise += perlinNoise(vec3(noise_x * s2 + u_time * -NOISE_X_SHIFT * 1.5, noise_y * s2 + 0.3, off2 + u_time * NOISE_SPEED)) * 0.5;
      noise += perlinNoise(vec3(noise_x * s3 + u_time * NOISE_X_SHIFT * 0.8, noise_y * s3 + 0.7, off3 + u_time * NOISE_SPEED)) * 0.4;
      noise += 0.45;
      float t = clamp(noise, 0.0, 1.0);
      t = pow(t, 2.0);
      // t = smoothstep(t);
      t = ease_out(t);
      return t;
    }
  
    vec3 color_from_lightness(float lightness) {
      lightness = clamp(lightness, 0.0, 1.0);
      return vec3(texture2D(u_gradient, vec2(lerp(0.00001, 0.999, lightness), 0.5)));
    }
  
    void main() {
      vec2 w1 = wave1(), w2 = wave2();
      
      float bg_lightness = calc_bg_lightness();
      float w1_lightness = w1.x, w1_alpha = w1.y;
      float w2_lightness = w2.x, w2_alpha = w2.y;
  
      vec3 w1_color = color_from_lightness(w1_lightness);
      vec3 w2_color = color_from_lightness(w2_lightness);
      vec3 bg_color = color_from_lightness(bg_lightness);
  
      ${includeif(
        options.accentColor != null,

        // if we're using an accent color
        () => /* glsl */ `
        float bg_accent_color_blend_fac = accent_lightness(-397.2,   64.2);
        float w1_accent_color_blend_fac = accent_lightness( 163.2, -512.3);
        float w2_accent_color_blend_fac = accent_lightness( 433.2,  127.9);
    
        bg_accent_color_blend_fac = clamp(bg_accent_color_blend_fac - pow(bg_lightness, 2.0), 0.0, 1.0);
        w1_accent_color_blend_fac = clamp(w1_accent_color_blend_fac - pow(w1_lightness, 2.0), 0.0, 1.0);
        w2_accent_color_blend_fac = clamp(w2_accent_color_blend_fac - pow(w2_lightness, 2.0), 0.0, 1.0);
    
        vec3 accent_color = ${hexToVec3(options.accentColor!)};
        bg_color = mix(bg_color, accent_color, bg_accent_color_blend_fac);
        w1_color = mix(w1_color, accent_color, w1_accent_color_blend_fac);
        w2_color = mix(w2_color, accent_color, w2_accent_color_blend_fac);

        // Comment out to visualize alpha mixing
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
      
      // float v = (1.0 + sin(u_time * 0.6)) * 0.5;
      // gl_FragColor = vec4(v, v, v, 1.0);
    }
  `;
}
