import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {
    time: {
      label: "math:S",
      range: [0, 150],
      value: 25,
      remap: [0, 7.5],
      step: 5,
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time; // Time in seconds

    const float PI = ${Math.PI.toFixed(8)};

    const float CANVAS_HEIGHT = 150.0;
    const float Y = CANVAS_HEIGHT * 0.5;
    const float A = 15.0;
    const float L = 75.0;
    const float S = 25.0;

    const float W = (2.0 * PI) / L; // Wave length multiplier

    const vec3 white = vec3(1.0, 1.0, 1.0);


    void main() {
      vec3 color_1 = vec3(0.7, 0.1, 0.4);
      vec3 color_2 = vec3(0.9, 0.6, 0.1);
      
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;
      float t = y / (CANVAS_HEIGHT - 1.0);

      vec3 color = mix(color_1, color_2, t);

      float curve_y = Y + sin((x + u_time * S) * W) * A;
      float alpha = (sign(curve_y - y) + 1.0) / 2.0;

      color = mix(color, white, alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
