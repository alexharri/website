import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision mediump float;

    uniform sampler2D u_gradient;
    uniform float u_w;

    void main() {
      float t = gl_FragCoord.x / (u_w - 1.0);
      gl_FragColor = texture2D(u_gradient, vec2(t, 0.5));
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
