import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_w;

    vec3 calc_color(float t) {
      vec3 color1 = vec3(1.0, 0.0, 0.0);
      vec3 color2 = vec3(1.0, 1.0, 0.0);
      vec3 color3 = vec3(0.0, 1.0, 0.0);
      vec3 color4 = vec3(0.0, 0.0, 1.0);
      vec3 color5 = vec3(1.0, 0.0, 1.0);

      float num_colors = 5.0;
      float N = num_colors - 1.0;

      vec3 color = mix(color1, color2, t * N);
      color = mix(color, color3, clamp((t - 1.0 / N) * N, 0.0, 1.0));
      color = mix(color, color4, clamp((t - 2.0 / N) * N, 0.0, 1.0));
      color = mix(color, color5, clamp((t - 3.0 / N) * N, 0.0, 1.0));
      return color;
    }

    void main() {
      float t = gl_FragCoord.x / (u_w - 1.0);
      gl_FragColor = vec4(calc_color(t), 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
