import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  const uniforms: FragmentShaderUniforms = {
    u_blur_amount: {
      label: "Blur amount",
      range: [0, 100],
      value: 35,
      step: 1,
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform float u_blur_amount;
    uniform float u_w;
    uniform float u_h;

    const float PI = ${Math.PI.toFixed(8)};

    float MID_Y = u_h * 0.5;
    float A = u_h * 0.1;
    float L = u_w * 0.3;
    float S = 20.0;

    void main() {
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;

      vec3 upper_color_1 = vec3(0.7, 0.1, 0.4);
      vec3 upper_color_2 = vec3(0.9, 0.6, 0.1);

      vec3 lower_color_1 = vec3(1.0, 0.7, 0.5);
      vec3 lower_color_2 = vec3(1.0, 1.0, 0.9);

      float t = y / (u_h - 1.0);
      vec3 upper_color = mix(upper_color_1, upper_color_2, t);
      vec3 lower_color = mix(lower_color_1, lower_color_2, t);

      float frequency = (2.0 * PI) / L;
      float to_phase = (S / L) * (2.0 * PI);
      float sine_input = x * frequency + u_time * to_phase;

      float curve_y = MID_Y + sin(sine_input) * A;
      float dist = curve_y - y;
      float lower_alpha = clamp(0.0 + dist / u_blur_amount, 0.0, 1.0);

      vec3 color = mix(upper_color, lower_color, lower_alpha);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
