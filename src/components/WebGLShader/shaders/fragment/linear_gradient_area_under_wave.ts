import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  const uniforms: FragmentShaderUniforms = {
    Y: {
      label: "math:Y",
      value: 0.5,
      range: [0, 1],
    },
    A: {
      label: "math:A",
      value: 15,
      range: [0, 30],
    },
    L: {
      label: "math:L",
      value: 75,
      range: [20, 150],
      step: 5,
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float Y;
    uniform float A;
    uniform float L;

    float CANVAS_HEIGHT = 150.0;
    float WAVE_Y = CANVAS_HEIGHT * Y;
    float WAVE_AMP = A;
    float WAVE_LEN = L;
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
      float toWaveLength = (1.0 / WAVE_LEN) * (2.0 * PI);

      float curve_y = WAVE_Y + sin(x * toWaveLength) * WAVE_AMP;
      float dist = curve_y - y;
      float dist_sign = sign(dist);
      float alpha = (dist_sign + 1.0) / 2.0;

      color = mix(color, white, alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
