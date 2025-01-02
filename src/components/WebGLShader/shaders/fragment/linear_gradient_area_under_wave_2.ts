import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  return /* glsl */ `
    precision mediump float;

    const float CANVAS_HEIGHT = 150.0;
    const float WAVE_CENTER = CANVAS_HEIGHT * 0.5;
    const float WAVE_AMPLITUDE = 15.0;
    const float WAVE_LEN = 75.0;
    const float PI = ${Math.PI.toFixed(8)};
    const vec3 white = vec3(1.0, 1.0, 1.0);


    void main() {
      vec3 bg_color_1 = vec3(0.7, 0.1, 0.4);
      vec3 bg_color_2 = vec3(0.9, 0.6, 0.1);

      vec3 fg_color_1 = vec3(1.0, 0.7, 0.5);
      vec3 fg_color_2 = vec3(1.0, 1.0, 0.9);

      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;
      float t = y / (CANVAS_HEIGHT - 1.0);

      vec3 bg_color = mix(bg_color_1, bg_color_2, t);
      vec3 fg_color = mix(fg_color_1, fg_color_2, t);

      // Y position of curve at current X coordinate
      const float toLength = 1.0 / (WAVE_LEN / (2.0 * PI));
      float curve_y = WAVE_CENTER + sin(x * toLength) * WAVE_AMPLITUDE;
      float dist = curve_y - y;
      float dist_sign = sign(dist);
      float fg_alpha = (dist_sign + 1.0) / 2.0;

      vec3 color = mix(bg_color, fg_color, fg_alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;
