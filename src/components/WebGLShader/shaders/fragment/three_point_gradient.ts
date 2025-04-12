import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision highp float;

    uniform float u_w;

    vec3 color1 = vec3(0.031, 0.0, 0.561);
    vec3 color2 = vec3(0.980, 0.0, 0.125);
    vec3 color3 = vec3(1.0,   0.8, 0.169);
    
    void main() {
      float t = gl_FragCoord.x / (u_w - 1.0);

      vec3 color = color1;
      color = mix(color, color2, min(1.0, t * 2.0));
      color = mix(color, color3, max(0.0, (t - 0.5) * 2.0));

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
