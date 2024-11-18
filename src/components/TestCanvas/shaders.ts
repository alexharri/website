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
const float PHASE = 1.0; // Higher is faster
const float WAVE_LEN = 300.0; // Higher is wider
const float WAVE_HEIGHT = 80.0; // Height in px
const float WAVE_Y = 0.33; // From 0 to 1

uniform vec2 u_resolution;
uniform float u_time;

void main() {
  vec2 xy = gl_FragCoord.xy / u_resolution.xy;

  float wave_len = u_resolution.x / WAVE_LEN * PI * 2.0;
  float wave_height = WAVE_HEIGHT / u_resolution.x * 2.0;

  float phase = u_time * PHASE;
  float x_sin_raw = sin(xy.x * wave_len + phase);
  float x_sin = (x_sin_raw + 1.0) * 0.5;

  float above_sign = sign(x_sin * wave_height + WAVE_Y - xy.y);
  float above_1_or_0 = (above_sign + 1.0) * 0.5;

  // gl_FragColor is a special variable a fragment shader is responsible for setting
  float lightness = above_1_or_0;

  gl_FragColor = vec4(lightness, lightness, lightness, 1); // return reddish-purple
}
`;
