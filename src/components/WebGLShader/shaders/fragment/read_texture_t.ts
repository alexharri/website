import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {
    x: {
      label: "math:x",
      value: 0,
      range: [0, 1],
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform sampler2D u_gradient;
    uniform float x;

    void main() {
      gl_FragColor = texture2D(u_gradient, vec2(x, 0.5));
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
