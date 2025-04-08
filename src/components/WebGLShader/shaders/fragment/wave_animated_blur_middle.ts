import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  const uniforms: FragmentShaderUniforms = {
    B: {
      label: "Blur amount",
      range: [0, 150],
      value: 50,
      step: 1,
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time; // Time in seconds
    uniform float B;

    const float CANVAS_HEIGHT = 150.0;
    const float CANVAS_WIDTH = 250.0;
    const float WAVE_Y = CANVAS_HEIGHT * 0.5;
    const float WAVE_AMP = 15.0;
    const float WAVE_LEN = 75.0;
    const float WAVE_SPEED = 20.0; // Pixels per seconds
    float BLUR_AMOUNT = B;
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

      const float frequency = 1.0 / (WAVE_LEN / (2.0 * PI));
      const float toPhase = (WAVE_SPEED / WAVE_LEN) * (2.0 * PI);
      float sine_input = x * frequency + u_time * toPhase;
      
      // Y position of curve at current X coordinate
      float curve_y = WAVE_Y + sin(sine_input) * WAVE_AMP;

      float dist = curve_y - y;
      float fg_alpha = 0.5 + dist / BLUR_AMOUNT;
      fg_alpha = clamp(fg_alpha, 0.0, 1.0);

      vec3 color = mix(bg_color, fg_color, fg_alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
