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

export const blurFragmentShader = /* glsl */ `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform sampler2D u_sine_texture;

  void main() {
    gl_FragColor = texture2D(u_sine_texture, gl_FragCoord.xy / u_resolution);
  }
`;

export const sineWaveFragmentShader = /* glsl */ `
  precision mediump float;

  const float PI = 3.14159;
  const float WAVE_LENGTH_SCALAR = 1000.0;
  const float WAVE1_HEIGHT = 40.0; // Height in px
  const float WAVE1_Y = 0.33; // From 0 to 1
  const float WAVE2_HEIGHT = 60.0; // Height in px
  const float WAVE2_Y = 0.71; // From 0 to 1
  const float WAVE_AMPLITUDE_SCALE = 1.0;
  const float BLUR_AMPLITUDE_SCALE = 1.0;
  const float WAVE_SPEED = 1.0; // Higher is faster
  const float NOISE_SPEED = 0.05; // Higher is faster
  const float NOISE_SCALE = 1.5; // Higher is smaller
  const float NOISE_X_SHIFT = 0.03; // Higher is faster

  uniform vec2 u_resolution;
  uniform float u_time;

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

  float lerp(float a, float b, float t) {
    return a * (1.0 - t) + b * t;
  }

  vec2 wave1() {
    float sin_sum = 0.0;
    sin_sum += sin(wave_len(2.180) + wave_phase(-0.15) + offset(0.3)) * wave_amp(0.6);
    sin_sum += sin(wave_len(4.193) + wave_phase(0.18) + offset(0.2)) * wave_amp(0.8);
    sin_sum += sin(wave_len(2.974) + wave_phase(0.13) + offset(0.0)) * wave_amp(0.75);
    sin_sum += sin(wave_len(3.395) + wave_phase(-0.21) + offset(0.7)) * wave_amp(0.8);
    sin_sum += sin(wave_len(2.683) + wave_phase(0.23) + offset(0.5)) * wave_amp(0.5);
    
    vec2 xy = gl_FragCoord.xy / u_resolution.xy;
    float wave_height = WAVE1_HEIGHT / H * 1.0;

    float sin_normalized = (sin_sum + 1.0) * 0.5;
    float sine_y = sin_normalized * wave_height + WAVE1_Y - (WAVE1_HEIGHT / H) * 0.5;
    float sine_dist_signed = sine_y - xy.y;
    float sine_dist = abs(sine_dist_signed);
    float sine_sign = sign(sine_dist_signed);
    float sine_pos = ((-sine_sign + 1.0) * 0.5);
    float sine_neg = 1.0 - sine_pos;
    
    float blur_sin_sum = 0.0;
    blur_sin_sum += sin(wave_len(4.739) + wave_phase(0.19) + offset(0.0)) * blur_amp(0.6);
    blur_sin_sum += sin(wave_len(3.232) + wave_phase(-0.22) + offset(0.8)) * blur_amp(0.3);
    blur_sin_sum += sin(wave_len(3.478) + wave_phase(0.28) + offset(0.4)) * blur_amp(0.2);
    blur_sin_sum += sin(wave_len(2.937) + wave_phase(-0.25) + offset(0.2)) * blur_amp(0.5);
    blur_sin_sum += sin(wave_len(4.888) + wave_phase(0.12) + offset(0.4)) * blur_amp(0.2);
    blur_sin_sum = min(1.0, max(-1.0, blur_sin_sum));

    float blur_sin = smooth_step((blur_sin_sum + 1.0) * 0.5);
    float blur_fac = blur_sin * 250.0;

    float delta = sine_dist_signed * u_resolution.y / blur_fac;
    float alpha_pos = min(1.0, max(0.0, 0.5 + delta));
    float alpha_neg = min(1.0, max(0.0, 0.5 + -delta));

    float alpha = alpha_pos * sine_pos + (1.0 - alpha_neg) * sine_neg;
    
    float noise_x = xy.x * NOISE_SCALE + u_time * NOISE_X_SHIFT;
    float noise_y = xy.y * NOISE_SCALE;
    float noise_raw = perlinNoise(vec3(noise_x, noise_y, u_time * NOISE_SPEED)) +
                      perlinNoise(vec3(noise_x, noise_y, 420.0 + u_time * NOISE_SPEED));
    float noise = lerp(0.5, 1.2, noise_raw);
    return vec2(noise, alpha);
  }

  vec2 wave2() {
    float sin_sum = 0.0;
    sin_sum += sin(wave_len(1430.0) + wave_phase(-0.16) + offset(0.8)) * wave_amp(0.35);
    sin_sum += sin(wave_len(977.0) + wave_phase(0.18) + offset(0.2)) * wave_amp(0.56);
    sin_sum += sin(wave_len(721.0) + wave_phase(0.15) + offset(0.7)) * wave_amp(0.4);
    sin_sum += sin(wave_len(870.0) + wave_phase(-0.23) + offset(0.2)) * wave_amp(0.39);
    sin_sum += sin(wave_len(1238.0) + wave_phase(0.15) + offset(0.5)) * wave_amp(0.5);
    
    vec2 xy = gl_FragCoord.xy / u_resolution.xy;
    float wave_height = WAVE2_HEIGHT / H * 0.17777;

    float sin_normalized = (sin_sum + 1.0) * 0.5;
    float sine_y = sin_normalized * wave_height + WAVE2_Y;
    float sine_dist_signed = xy.y - sine_y;
    float sine_dist = abs(sine_dist_signed);
    float sine_sign = sign(sine_dist_signed);
    float sine_pos = ((-sine_sign + 1.0) * 0.5);
    float sine_neg = 1.0 - sine_pos;
    
    float blur_sin_sum = 0.0;
    blur_sin_sum += sin(wave_len(1220.0) + wave_phase(0.25) + offset(0.2)) * blur_amp(0.47);
    blur_sin_sum += sin(wave_len(989.0) + wave_phase(0.22) + offset(0.0)) * blur_amp(0.4);
    blur_sin_sum += sin(wave_len(1463.0) + wave_phase(-0.19) + offset(0.7)) * blur_amp(0.5);
    blur_sin_sum += sin(wave_len(1280.0) + wave_phase(0.17) + offset(0.4)) * blur_amp(0.4);
    blur_sin_sum += sin(wave_len(890.0) + wave_phase(-0.14) + offset(0.87)) * blur_amp(0.3);
    blur_sin_sum = min(1.0, max(-1.0, blur_sin_sum));

    float blur_sin = smooth_step((blur_sin_sum + 1.0) * 0.5);
    float blur_fac = blur_sin * 250.0;

    float delta = sine_dist_signed * u_resolution.y / blur_fac;
    float alpha_pos = min(1.0, max(0.0, 0.5 + delta));
    float alpha_neg = min(1.0, max(0.0, 0.5 + -delta));

    float alpha = alpha_pos * sine_pos + (1.0 - alpha_neg) * sine_neg;
    
    float noise_x = xy.x * NOISE_SCALE + u_time * NOISE_X_SHIFT;
    float noise_y = xy.y * NOISE_SCALE;
    float noise_raw = perlinNoise(vec3(noise_x, noise_y, -100.0 + u_time * NOISE_SPEED)) +
                      perlinNoise(vec3(noise_x, noise_y, -420.0 + u_time * NOISE_SPEED));
    float noise = lerp(0.5, 1.2, noise_raw);
    return vec2(noise, alpha);
  }

  float baselineLightness() {
    vec2 xy = gl_FragCoord.xy / u_resolution.xy;
    float noise_x = xy.x * NOISE_SCALE + u_time * NOISE_X_SHIFT;
    float noise_y = xy.y * NOISE_SCALE;
    return perlinNoise(vec3(noise_x, noise_y, -256.0 + u_time * NOISE_SPEED));
  }

  void main() {
    vec2 w1 = wave1();
    float w1_lightness = w1.x;
    float w1_alpha = w1.y;

    vec2 w2 = wave2();
    float w2_lightness = w2.x;
    float w2_alpha = w2.y;
    
  
    float lightness = 0.0; //baselineLightness();

    lightness = lerp(lightness, w1_lightness, w1_alpha);
    // lightness = lerp(lightness, w2_lightness, w2_alpha);
    
    gl_FragColor = vec4(lightness, lightness, lightness, 1.0);
  }
`;
