import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  return /* glsl */ `
    precision highp float;

    uniform float u_h;

    void main() {
      vec3 color_1 = vec3(0.7, 0.1, 0.4);
      vec3 color_2 = vec3(0.9, 0.6, 0.1);

      float y = gl_FragCoord.y;
      float t = y / (u_h - 1.0);

      vec3 color = mix(color_1, color_2, t);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;
