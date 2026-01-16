import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {
    u_x: {
      label: "math:x",
      value: 0,
      range: [0, 1],
      step: 0.1,
    },
  };
  const shader = /* glsl */ `
    precision highp float;

    uniform sampler2D u_gradient;
    uniform float u_x;

    void main() {
      gl_FragColor = texture2D(u_gradient, vec2(u_x, 0.5));
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
