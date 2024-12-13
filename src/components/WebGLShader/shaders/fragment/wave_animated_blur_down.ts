import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  return /* glsl */ `
    precision mediump float;

    uniform float u_time; // Time in seconds

    const float CANVAS_HEIGHT = 150.0;
    const float CANVAS_WIDTH = 250.0;
    const float WAVE_Y = CANVAS_HEIGHT * 0.5;
    const float WAVE_AMP = 15.0;
    const float WAVE_LEN = 75.0;
    const float WAVE_SPEED = 20.0; // Pixels per seconds
    const float BLUR_AMOUNT = 50.0;
    const float PI = ${Math.PI.toFixed(8)};

    float smoothstep(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    void main() {
      float x = gl_FragCoord.x, y = gl_FragCoord.y;

      vec3 bg_color_1 = vec3(0.7, 0.1, 0.4);
      vec3 bg_color_2 = vec3(0.9, 0.6, 0.1);

      vec3 fg_color_1 = vec3(1.0, 0.7, 0.5);
      vec3 fg_color_2 = vec3(1.0, 1.0, 0.9);

      float t = y / (CANVAS_HEIGHT - 1.0);
      vec3 bg_color = mix(bg_color_1, bg_color_2, t);
      vec3 fg_color = mix(fg_color_1, fg_color_2, t);

      const float toLength = 1.0 / (WAVE_LEN / (2.0 * PI));
      const float toPhase = (WAVE_SPEED / WAVE_LEN) * (2.0 * PI);
      float sine_input = x * toLength + u_time * toPhase;
      
      // Y position of curve at current X coordinate
      float curve_y = WAVE_Y + sin(sine_input) * WAVE_AMP;

      float blur_t = smoothstep(x / (CANVAS_WIDTH - 1.0));
      float blur_amount = mix(1.0, BLUR_AMOUNT, blur_t);

      float dist_signed = curve_y - y;
      float fg_alpha = 0.0 + dist_signed / blur_amount;
      fg_alpha = clamp(fg_alpha, 0.0, 1.0);

      vec3 color = mix(bg_color, fg_color, fg_alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;
