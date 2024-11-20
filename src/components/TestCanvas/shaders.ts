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
  const float BLUR_BIAS = 0.8; // Higher means it's harder to get sharp lines (values from 0.8 to 1.2 work great)
  const float WAVE_SPEED = 1.0; // Higher is faster
  const float NOISE_SPEED = 0.05; // Higher is faster
  const float NOISE_SCALE = 1.5; // Higher is smaller
  const float NOISE_X_SHIFT = 0.03; // Higher is faster

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
    float noise_raw = perlinNoise(vec3(noise_x, noise_y, off1 + u_time * NOISE_SPEED)) +
                      perlinNoise(vec3(noise_x, noise_y, off2 + u_time * NOISE_SPEED));
    float noise = lerp(0.5, 1.2, noise_raw);
    return noise;
  }

  vec2 wave1() {
    float sin_sum = 0.0;
    sin_sum += sin(wave_len(2.180) + wave_phase(-0.15) + offset(0.3)) * wave_amp(0.6);
    sin_sum += sin(wave_len(4.193) + wave_phase(0.18) + offset(0.2)) * wave_amp(0.8);
    sin_sum += sin(wave_len(2.974) + wave_phase(0.13) + offset(0.0)) * wave_amp(0.75);
    sin_sum += sin(wave_len(3.395) + wave_phase(-0.21) + offset(0.7)) * wave_amp(0.8);
    sin_sum += sin(wave_len(2.683) + wave_phase(0.23) + offset(0.5)) * wave_amp(0.5);
    
    float blur_sin_sum = 0.0;
    blur_sin_sum += sin(wave_len(4.739) + wave_phase(0.19) + offset(0.0)) * blur_amp(0.6);
    blur_sin_sum += sin(wave_len(3.232) + wave_phase(-0.22) + offset(0.8)) * blur_amp(0.3);
    blur_sin_sum += sin(wave_len(3.478) + wave_phase(0.28) + offset(0.4)) * blur_amp(0.2);
    blur_sin_sum += sin(wave_len(2.937) + wave_phase(-0.25) + offset(0.2)) * blur_amp(0.5);
    blur_sin_sum += sin(wave_len(4.888) + wave_phase(0.12) + offset(0.4)) * blur_amp(0.2);
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

  float baselineLightness() {
    vec2 xy = gl_FragCoord.xy / u_resolution.xy;
    float noise_x = xy.x * NOISE_SCALE + u_time * NOISE_X_SHIFT;
    float noise_y = xy.y * NOISE_SCALE * 0.5 + 0.7;

    float s1 = 0.9, s2 = 0.6, s3 = 0.35;
    return
      perlinNoise(vec3(noise_x * s1, noise_y * s1, -256.0 + u_time * NOISE_SPEED)) +
      perlinNoise(vec3(noise_x * s2, noise_y * s2 + 0.3, -532.0 + u_time * NOISE_SPEED)) +
      perlinNoise(vec3(noise_x * s3, noise_y * s3 + 0.8, -192.0 + u_time * NOISE_SPEED));
  }

  void main() {
    vec2 w1 = wave1();
    float w1_lightness = w1.x;
    float w1_alpha = w1.y;

    vec2 w2 = wave2();
    float w2_lightness = w2.x;
    float w2_alpha = w2.y;
  
    float lightness = baselineLightness();

    lightness = lerp(lightness, w2_lightness, w2_alpha);
    lightness = lerp(lightness, w1_lightness, w1_alpha);

    lightness = clamp(lightness, 0.0, 1.0);

    // Map lightness from red to blue
    // vec4 color = mix(vec4(1.0, 0.0, 0.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0), lightness);
    vec4 color = texture2D(u_gradient, vec2(lerp(0.00001, 0.999, lightness), 0.5));
    
    gl_FragColor = color;
    // gl_FragColor = vec4(lightness, lightness, lightness, 1.0);
  }
`;
