import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  return /* glsl */ `
    precision mediump float;

    const float CANVAS_HEIGHT = 150.0;
    const float WAVE_Y = CANVAS_HEIGHT * 0.5;
    const float WAVE_AMP = 15.0;
    const float WAVE_LEN = 75.0;
    const float PI = ${Math.PI.toFixed(8)};
    const vec3 white = vec3(1.0, 1.0, 1.0);


    void main() {
      vec3 color_1 = vec3(0.7, 0.1, 0.4);
      vec3 color_2 = vec3(0.9, 0.6, 0.1);

      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;
      float t = y / (CANVAS_HEIGHT - 1.0);

      vec3 color = mix(color_1, color_2, t);

      // Y position of curve at current X coordinate
      const float toWaveLength = (1.0 / WAVE_LEN) * (2.0 * PI);

      float curve_y = WAVE_Y + sin(x * toWaveLength) * WAVE_AMP;
      float dist = curve_y - y;
      float dist_sign = sign(dist);
      float alpha = (dist_sign + 1.0) / 2.0;

      color = mix(color, white, alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;
