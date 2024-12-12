import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (options) => {
  const { waveLength = 250, waveHeight = 32 } = options as {
    waveLength: number;
    waveHeight: number;
  };

  return /* glsl */ `
    precision mediump float;

    uniform float u_time;

    const float WIDTH = 200.0, HEIGHT = 150.0;
    const float PI = 3.14159, TAU = PI * 2.0;
    
    const float WAVE_LENGTH = ${waveLength.toFixed(1)};
    const float WAVE_HEIGHT = ${waveHeight.toFixed(1)};
    const float TO_LENGTH = 1.0 / (WAVE_LENGTH / TAU);
    const float SPEED = 1.3;

    void main() {
      float t = sin(gl_FragCoord.x * TO_LENGTH + u_time * SPEED);

      float waveY = HEIGHT / 2.0 + t * WAVE_HEIGHT;
      float offset = gl_FragCoord.y - waveY;
      float s = (-sign(offset) + 1.0) / 2.0;

      vec3 foreground_lower = vec3(0.965,0.992,0.745);
      vec3 foreground_upper = vec3(1.0,0.702,0.443);
      vec3 background_lower = vec3(0.91,0.604,0.412);
      vec3 background_upper = vec3(0.647,0.314,0.204);

      float t_y = gl_FragCoord.y / HEIGHT;
      vec3 foreground_color = mix(foreground_lower, foreground_upper, t_y);
      vec3 background_color = mix(background_lower, background_upper, t_y);
      vec3 color = mix(foreground_color, background_color, s);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;
