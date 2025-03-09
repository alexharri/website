import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision mediump float;

    uniform sampler2D u_gradient;
    uniform float u_h;

    void main() {
      float t = gl_FragCoord.y / (u_h - 1.0);
      gl_FragColor = texture2D(u_gradient, vec2(1.0 - t, 0.5));
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
