import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform float u_h;

    float WAVE_HEIGHT = 0.128 * u_h;
    
    float noise(float l, float s, float a) {
      const float L = 0.019;
      const float S = 0.5;
      return sin(gl_FragCoord.x * (L / l) + u_time * s * S) * a;
    }

    float calc_alpha(float noise_fac, float h, int i) {
      float wave_y = u_h * (0.52 + float(i) * 0.21) + noise_fac * WAVE_HEIGHT * h;
      float dist = wave_y - gl_FragCoord.y;

      float alpha = 1.0;
      alpha *= clamp(3.7 + dist, 0.0, 1.0);
      alpha *= clamp(0.0 - dist, 0.0, 1.0);
      return alpha;
    }

    void main() {
      float alpha = 0.0;

      alpha += calc_alpha(noise(1.000,  0.90, 0.64), 0.8, -2);
      alpha += calc_alpha(noise(1.871,  0.65, 0.43), 0.8, -1);
      alpha += calc_alpha(noise(1.622, -0.75, 0.48), 0.8,  0);
      alpha += calc_alpha(noise(1.153,  1.15, 0.40), 0.8,  1);
      alpha += calc_alpha(noise(2.013, -1.05, 0.32), 0.8,  2);

      alpha = clamp(alpha, 0.0, 1.0);

      vec3 black = vec3(0.035,0.051,0.075);
      vec3 white = vec3(0.725,0.859,0.98);
      vec3 color = mix(black, white, alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
