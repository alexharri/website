import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (options) => {
  const { waveLength = 1 } = options as { waveLength: number };
  const uniforms: FragmentShaderUniforms = {
    u_wavelength: {
      label: "math:L",
      value: waveLength,
      range: [10, 100],
    },
  };
  const shader = /* glsl */ `
    precision highp float;

    uniform float u_wavelength;
    
    const float PI = ${Math.PI.toFixed(6)};
    float frequency = (2.0 * PI) / u_wavelength;

    void main() {
      vec3 red   = vec3(1.0, 0.0, 0.0);
      vec3 blue  = vec3(0.0, 0.0, 1.0);

      float t = sin(gl_FragCoord.x * frequency);
      t = (t + 1.0) * 0.5;

      vec3 color = mix(red, blue, t);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
