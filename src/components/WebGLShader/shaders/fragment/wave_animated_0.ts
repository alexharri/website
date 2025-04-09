import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {
    time: {
      label: "math:S",
      range: [25, 150],
      value: 25,
      step: 5,
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform float u_w;
    uniform float u_h;

    float time = u_time / 25.0;

    const float PI = ${Math.PI.toFixed(8)};

    float MID_Y = u_h * 0.5;
    float A = u_h * 0.1;
    float L = u_w * 0.5;
    float S = 25.0;

    float FREQUENCY = (2.0 * PI) / L;

    const vec3 white = vec3(1.0, 1.0, 1.0);

    void main() {
      vec3 color_1 = vec3(0.7, 0.1, 0.4);
      vec3 color_2 = vec3(0.9, 0.6, 0.1);
      
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;
      float t = y / (u_h - 1.0);

      vec3 color = mix(color_1, color_2, t);

      float curve_y = MID_Y + sin((x + time * S) * FREQUENCY) * A;
      float alpha = (sign(curve_y - y) + 1.0) / 2.0;

      color = mix(color, white, alpha);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
