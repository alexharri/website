import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_h;

    float Y = u_h * 0.5;
    const float A = 15.0;
    const float L = 75.0;

    const float PI = ${Math.PI.toFixed(8)};
    
    const vec3 white = vec3(1.0, 1.0, 1.0);

    void main() {
      vec3 color_1 = vec3(0.7, 0.1, 0.4);
      vec3 color_2 = vec3(0.9, 0.6, 0.1);

      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;
      
      float t = y / (u_h - 1.0);
      vec3 color = mix(color_1, color_2, t);

      float toWaveLength = (1.0 / L) * (2.0 * PI);
      float curve_y = Y + sin(x * toWaveLength) * A;
      float dist = curve_y - y;
      float alpha = (sign(dist) + 1.0) / 2.0;

      color = mix(color, white, alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
