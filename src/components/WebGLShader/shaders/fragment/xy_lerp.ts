import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  return /* glsl */ `
    precision mediump float;

    float WIDTH = 150.0;

    void main() {
      vec3 red   = vec3(1.0, 0.0, 0.0);
      vec3 blue  = vec3(0.0, 0.0, 1.0);
      vec3 white = vec3(1.0, 1.0, 1.0);

      vec3 color = red;
      color = mix(color, blue,        gl_FragCoord.x / 150.0);
      color = mix(color, white, 1.0 - gl_FragCoord.y / 150.0);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;
