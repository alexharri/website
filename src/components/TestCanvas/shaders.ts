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
  const float WAVE_HEIGHT = 80.0; // Height in px
  const float WAVE_Y = 0.33; // From 0 to 1
  const float NOISE_SPEED = 0.1; // Higher is faster
  const float NOISE_SCALE = 1.5; // Higher is smaller

  uniform vec2 u_resolution;
  uniform float u_time;

  float W = u_resolution.x;
  float H = u_resolution.y;

  ${perlinNoise}

  float smooth_step(float t) {
    return t * t * t * (t * (6.0 * t - 15.0) + 10.0);
  }

  float to_wave_px(float px) {
    return (1.0 / px) * W * 0.008 * gl_FragCoord.x;
  }

  float to_phase(float phase) {
    return u_time * phase;
  }

  float offset(float t) {
    return t * PI * 2.0;
  }

  float pow2(float value) {
    return value * value;
  }

  float lerp(float a, float b, float t) {
    return a * (1.0 - t) + b * t;
  }

  void main() {
    float sin_sum = 0.0;
    sin_sum += sin(to_wave_px(930.0) + to_phase(0.13) + offset(0.0)) * 0.75;
    sin_sum += sin(to_wave_px(777.0) + to_phase(-0.15) + offset(0.3)) * 0.6;
    sin_sum += sin(to_wave_px(1221.0) + to_phase(0.18) + offset(0.2)) * 0.8;
    sin_sum += sin(to_wave_px(670.0) + to_phase(0.23) + offset(0.5)) * 0.5;
    sin_sum += sin(to_wave_px(738.0) + to_phase(-0.21) + offset(0.7)) * 0.8;
    
    vec2 xy = gl_FragCoord.xy / u_resolution.xy;
    float wave_height = WAVE_HEIGHT / u_resolution.x * 2.0;

    float sin_normalized = (sin_sum + 1.0) * 0.5;
    float sine_y = sin_normalized * wave_height + WAVE_Y;
    float sine_dist_signed = sine_y - xy.y;
    float sine_dist = abs(sine_dist_signed);
    float sine_sign = sign(sine_dist_signed);
    float sine_pos = ((-sine_sign + 1.0) * 0.5);
    float sine_neg = 1.0 - sine_pos;
    
    float blur_sin_sum = 0.0;
    blur_sin_sum += sin(to_wave_px(820.0) + to_phase(0.19) + offset(0.0)) * 0.6;
    blur_sin_sum += sin(to_wave_px(1583.0) + to_phase(-0.22) + offset(0.8)) * 0.3;
    blur_sin_sum += sin(to_wave_px(1263.0) + to_phase(0.28) + offset(0.4)) * 0.2;
    blur_sin_sum += sin(to_wave_px(1180.0) + to_phase(-0.25) + offset(0.2)) * 0.5;
    blur_sin_sum += sin(to_wave_px(690.0) + to_phase(0.12) + offset(0.4)) * 0.2;
    blur_sin_sum = min(1.0, max(-1.0, blur_sin_sum));

    float blur_sin = smooth_step((blur_sin_sum + 1.0) * 0.5);
    float blur_fac = blur_sin * 250.0;

    float delta = sine_dist_signed * u_resolution.y / blur_fac;
    float alpha_pos = min(1.0, max(0.0, 0.5 + delta));
    float alpha_neg = min(1.0, max(0.0, 0.5 + -delta));

    float alpha = alpha_pos * sine_pos + (1.0 - alpha_neg) * sine_neg;
    
    float noise_x = xy.x * NOISE_SCALE + u_time * 0.1;
    float noise_y = xy.y * NOISE_SCALE;
    float noise_raw = perlinNoise(vec3(noise_x, noise_y, u_time * NOISE_SPEED)) +
                      perlinNoise(vec3(noise_x, noise_y, 420.0 + u_time * NOISE_SPEED));
    float noise = lerp(0.5, 1.0, noise_raw);
    
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * noise);
  }
`;
