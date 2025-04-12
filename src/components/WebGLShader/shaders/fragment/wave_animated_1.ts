import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision highp float;

    uniform float u_time;
    uniform float u_w;
    uniform float u_h;

    const float PI = ${Math.PI.toFixed(8)};

    float MID_Y = u_h * 0.5;
    float A = u_h * 0.1;
    float L = u_w * 0.5;
    float S = 25.0;

    float FREQUENCY = (2.0 * PI) / L;

    const vec3 white = vec3(1.0, 1.0, 1.0);

    void main() {
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;
      float t = y / (u_h - 1.0);

      vec3 bg_color_1 = vec3(0.7, 0.1, 0.4);
      vec3 bg_color_2 = vec3(0.9, 0.6, 0.1);

      vec3 fg_color_1 = vec3(1.0, 0.7, 0.5);
      vec3 fg_color_2 = vec3(1.0, 1.0, 0.9);

      vec3 bg_color = mix(bg_color_1, bg_color_2, t);
      vec3 fg_color = mix(fg_color_1, fg_color_2, t);

      float curve_y = MID_Y + sin((x + u_time * S) * FREQUENCY) * A;
      float alpha = (sign(curve_y - y) + 1.0) / 2.0;

      vec3 color = mix(bg_color, fg_color, alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
