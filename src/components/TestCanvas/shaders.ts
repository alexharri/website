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

export const fragmentShader = /* glsl */ `
  precision mediump float;

  const float PI = 3.14159;
  const float WAVE_LENGTH_SCALAR = 1000.0;
  const float WAVE1_HEIGHT = 40.0; // Height in px
  const float WAVE1_Y = 0.45; // From 0 to 1
  const float WAVE2_HEIGHT = 30.0; // Height in px
  const float WAVE2_Y = 0.9; // From 0 to 1
  const float WAVE_AMPLITUDE_SCALE = 1.0;
  const float BLUR_AMPLITUDE_SCALE = 1.0;
  const float BLUR_HEIGHT = 300.0;
  const float BLUR_BIAS = 1.15; // Higher means it's harder to get sharp lines (values from 0.8 to 1.2 work great)
  const float WAVE_SPEED = 1.0; // Higher is faster
  const float NOISE_SPEED = 0.08; // Higher is faster
  const float NOISE_SCALE = 1.5; // Higher is smaller
  const float ACCENT_NOISE_SCALE = 1.0; // Smaller is bigger
  const float NOISE_X_SHIFT = 0.02; // Higher is faster

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform sampler2D u_gradient; // height=1, width=N

  float W = u_resolution.x;
  float H = u_resolution.y;

  ${perlinNoise}

  float smooth_step(float t)
    { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

  float wave_len(float value)
    { return ((gl_FragCoord.x / 1.0) / (u_resolution.x / W)) * 0.02 * (1.0 / value); }

  float wave_phase(float phase)
    { return u_time * phase * WAVE_SPEED; }

  float wave_amp(float value)
    { return value * WAVE_AMPLITUDE_SCALE; }

  float blur_amp(float value)
    { return value * BLUR_AMPLITUDE_SCALE; }

  float offset(float t)
    { return t * PI * 2.0; }

  float pow2(float value)
    { return value * value; }

  float lerp(float a, float b, float t)
    { return a * (1.0 - t) + b * t; }

  float calc_dist(float wave_y, float wave_height_px, float curve_y_off) {
    float wave_height = wave_height_px / H;
    float curve_y = wave_y + curve_y_off * wave_height;
    float y = gl_FragCoord.y / u_resolution.y;
    float dist = curve_y - y;
    return dist;
  }

  float calc_blur(float blur_sin_sum) {
    float blur_normalized = (blur_sin_sum + BLUR_BIAS) * 0.5;
    // Squaring the blur means a quicker transition from no blur to a lot of blur
    //
    // Without squaring, we get long semi blurred lines, which don't look great.
    blur_normalized *= blur_normalized;

    // max(0.1, ...) to avoid a near-zero blur that appears to the user as a lack
    // of anti-aliasing.
    return smooth_step(clamp(blur_normalized, 0.1, 1.0)) * BLUR_HEIGHT;
  }

  float calc_alpha(float dist, float blur_fac) {
    float dist_sign_pos = (-sign(dist) + 1.0) * 0.5;
    float dist_sign_neg = 1.0 - dist_sign_pos;

    float delta = dist * u_resolution.y / blur_fac;
    float alpha_pos = min(1.0, max(0.0, 0.5 + delta));
    float alpha_neg = min(1.0, max(0.0, 0.5 + -delta));

    float alpha = alpha_pos * dist_sign_pos + (1.0 - alpha_neg) * dist_sign_neg;
    return smooth_step(alpha);
  }

  float calc_noise(float off1, float off2) {
    vec2 xy = gl_FragCoord.xy / u_resolution.xy;
    float noise_x = xy.x * NOISE_SCALE + u_time * NOISE_X_SHIFT;
    float noise_y = xy.y * NOISE_SCALE;
    float s1 = 1.0, s2 = 0.7, s3 = 0.4;
    float off3 = off1 - off2;
    float noise_raw =
      perlinNoise(vec3(noise_x * s1, noise_y * s1, off1 + u_time * NOISE_SPEED)) * 0.4 +
      perlinNoise(vec3(noise_x * s2, noise_y * s2, off2 + u_time * NOISE_SPEED)) * 0.35 +
      perlinNoise(vec3(noise_x * s2, noise_y * s2, off3 + u_time * NOISE_SPEED)) * 0.25 +
      0.5;
    return smooth_step(noise_raw);
  }

  vec2 wave1() {
    float sin_sum = 0.0;
    sin_sum += sin(wave_len(5.180) + wave_phase(-0.15) + offset(0.3)) * wave_amp(0.6);
    sin_sum += sin(wave_len(3.193) + wave_phase( 0.18) + offset(0.2)) * wave_amp(0.8);
    sin_sum += sin(wave_len(5.974) + wave_phase( 0.13) + offset(0.0)) * wave_amp(0.6);
    sin_sum += sin(wave_len(6.395) + wave_phase(-0.21) + offset(0.7)) * wave_amp(0.4);
    sin_sum += sin(wave_len(9.683) + wave_phase( 0.23) + offset(0.5)) * wave_amp(0.5);

    // up-down wave
    sin_sum += sin(wave_len(200.0) + wave_phase( 0.092) + offset(0.7)) * wave_amp(0.8);
    sin_sum += sin(wave_len(200.0) + wave_phase(-0.136) + offset(0.3)) * wave_amp(0.6);
    sin_sum += sin(wave_len(200.0) + wave_phase( 0.118) + offset(0.1)) * wave_amp(0.9);
    
    float blur_sin_sum = 0.0;
    blur_sin_sum += sin(wave_len( 4.739) + wave_phase(-0.19) + offset(0.9)) * blur_amp(0.6);
    blur_sin_sum += sin(wave_len( 4.296) + wave_phase( 0.28) + offset(0.1)) * blur_amp(0.4);
    blur_sin_sum += sin(wave_len(12.232) + wave_phase(-0.32) + offset(0.8)) * blur_amp(0.6);
    blur_sin_sum += sin(wave_len( 8.478) + wave_phase( 0.28) + offset(0.4)) * blur_amp(0.2);
    blur_sin_sum += sin(wave_len( 3.937) + wave_phase(-0.25) + offset(0.2)) * blur_amp(0.5);
    blur_sin_sum += sin(wave_len( 7.888) + wave_phase( 0.19) + offset(0.4)) * blur_amp(0.3);
    blur_sin_sum = min(1.0, max(-1.0, blur_sin_sum));
    
    float dist = calc_dist(WAVE1_Y, WAVE1_HEIGHT, sin_sum);
    float alpha = calc_alpha(dist, calc_blur(blur_sin_sum));
    float noise = calc_noise(0.0, 420.0);
    return vec2(noise, alpha);
  }

  vec2 wave2() {
    float sin_sum = 0.0;
    sin_sum += sin(wave_len(4.410) + wave_phase( 0.149) + offset(0.6)) * wave_amp(0.2);
    sin_sum += sin(wave_len(3.823) + wave_phase(-0.140) + offset(0.4)) * wave_amp(0.7);
    sin_sum += sin(wave_len(4.274) + wave_phase( 0.173) + offset(0.9)) * wave_amp(0.5);
    sin_sum += sin(wave_len(3.815) + wave_phase(-0.212) + offset(0.2)) * wave_amp(0.8);
    sin_sum += sin(wave_len(3.183) + wave_phase( 0.218) + offset(0.1)) * wave_amp(0.4);
    
    float blur_sin_sum = 0.0;
    blur_sin_sum += sin(wave_len(3.539) + wave_phase(-0.175) + offset(0.2)) * blur_amp(0.4);
    blur_sin_sum += sin(wave_len(4.232) + wave_phase( 0.113) + offset(0.5)) * blur_amp(0.7);
    blur_sin_sum += sin(wave_len(2.893) + wave_phase( 0.142) + offset(0.8)) * blur_amp(0.5);
    blur_sin_sum += sin(wave_len(3.972) + wave_phase(-0.127) + offset(0.3)) * blur_amp(0.2);
    blur_sin_sum += sin(wave_len(4.389) + wave_phase( 0.134) + offset(0.1)) * blur_amp(0.5);
    blur_sin_sum = min(1.0, max(-1.0, blur_sin_sum));

    float dist = calc_dist(WAVE2_Y, WAVE2_HEIGHT, sin_sum);
    float alpha = calc_alpha(dist, calc_blur(blur_sin_sum));
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
    float noise_x = xy.x * ACCENT_NOISE_SCALE + u_time * NOISE_X_SHIFT;
    float noise_y = xy.y * ACCENT_NOISE_SCALE * 1.15;
    float off3 = off1 - off2;

    // s1 is smaller than s2
    float s1 = 1.5, s2 = 1.0, s3 = 0.7;
    float noise = -0.0;
    noise += perlinNoise(vec3(noise_x * s1, noise_y * s1 + 0.0, off1 + u_time * NOISE_SPEED)) * 0.75;
    noise += perlinNoise(vec3(noise_x * s2, noise_y * s2 + 0.3, off2 + u_time * NOISE_SPEED)) * 0.6;
    noise += perlinNoise(vec3(noise_x * s3, noise_y * s3 + 0.7, off3 + u_time * NOISE_SPEED)) * 0.4;
    float t = clamp(noise, 0.0, 1.0);
    t = sqrt(t);
    t = smooth_step(t);
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

    
    float bg_acc_t = accent_lightness(-397.2,   64.2);
    float w1_acc_t = accent_lightness( 163.2, -512.3);
    float w2_acc_t = accent_lightness( 433.2,  127.9);

    vec3 accent_color = vec3(0.75, 0.37, 1.0);
    bg_color = mix(bg_color, accent_color, clamp(bg_acc_t - bg_lightness, 0.0, 1.0));
    w1_color = mix(w1_color, accent_color, clamp(w1_acc_t - w1_lightness, 0.0, 1.0));
    w2_color = mix(w2_color, accent_color, clamp(w2_acc_t - w2_lightness, 0.0, 1.0));

    vec3 color = color_from_lightness(0.0);
    color = bg_color;
    color = mix(color, w2_color, w2_alpha);
    color = mix(color, w1_color, w1_alpha);
  

    gl_FragColor = vec4(color, 1.0);
    // gl_FragColor = vec4(lightness, lightness, lightness, 1.0);
  }
`;
