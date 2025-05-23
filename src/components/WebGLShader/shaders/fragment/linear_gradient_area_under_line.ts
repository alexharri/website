import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision highp float;

    uniform float u_h;

    float MID_Y = u_h * 0.5;

    const vec3 white = vec3(1.0, 1.0, 1.0);

    void main() {
      vec3 color_1 = vec3(0.7, 0.1, 0.4);
      vec3 color_2 = vec3(0.9, 0.6, 0.1);

      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;
      
      float t = y / (u_h - 1.0);
      vec3 color = mix(color_1, color_2, t);

      float dist = MID_Y - y;
      float alpha = (sign(dist) + 1.0) / 2.0;

      color = mix(color, white, alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
