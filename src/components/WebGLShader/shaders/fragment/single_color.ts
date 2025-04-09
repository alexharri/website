import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  return /* glsl */ `
    precision mediump float;

    void main() {
      gl_FragColor = vec4(0.7, 0.1, 0.4, 1.0);
    }
  `;
};

export default createFragmentShader;
