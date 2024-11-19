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
const float WAVE_LEN = 300.0; // Higher is wider
const float WAVE_HEIGHT = 80.0; // Height in px
const float WAVE_Y = 0.33; // From 0 to 1

uniform vec2 u_resolution;
uniform float u_time;

float to_wave_px(float px) {
  float W = u_resolution.xy.x;
  float x = gl_FragCoord.x / u_resolution.x;
  return x * (W / px) * PI;
}

float to_phase(float phase) {
  return u_time * phase;
}

float offset(float t) {
  return t * PI * 2.0;
}

void main() {
  vec2 xy = gl_FragCoord.xy / u_resolution.xy;

  float wave_len = u_resolution.x * PI * 2.0;
  float wave_height = WAVE_HEIGHT / u_resolution.x * 2.0;

  float sin_sum = 0.0;

  sin_sum += sin(to_wave_px(432.0) + to_phase(0.37) + offset(0.0)) * 0.75;
  sin_sum += sin(to_wave_px(277.0) + to_phase(0.25) + offset(0.3)) * 0.6;
  sin_sum += sin(to_wave_px(421.0) + to_phase(0.18) + offset(0.2)) * 0.8;
  sin_sum += sin(to_wave_px(370.0) + to_phase(0.38) + offset(0.5)) * 0.5;
  sin_sum += sin(to_wave_px(238.0) + to_phase(0.41) + offset(0.7)) * 0.8;
  
  float x_sin = (sin_sum + 1.0) * 0.5;

  float above_sign = sign(x_sin * wave_height + WAVE_Y - xy.y);
  float above_1_or_0 = (above_sign + 1.0) * 0.5;

  // gl_FragColor is a special variable a fragment shader is responsible for setting
  float lightness = above_1_or_0;

  gl_FragColor = vec4(lightness, lightness, lightness, 1); // return reddish-purple
}
`;
