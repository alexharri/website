import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {
    time2: {
      label: "math:S",
      value: 20,
      range: [0.0, 100],
      step: 5,
    },
  };
  const shader = /* glsl */ `
    precision highp float;

    uniform float u_time2;

    const float L = 40.0;
    const float PI = ${Math.PI.toFixed(6)};
    const float FREQUENCY = (2.0 * PI) / L;

    void main() {
      vec3 red  = vec3(1.0, 0.0, 0.0);
      vec3 blue = vec3(0.0, 0.0, 1.0);

      float t = sin((gl_FragCoord.x + u_time2) * FREQUENCY);
      t = (t + 1.0) / 2.0;

      vec3 color = mix(red, blue, t);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
