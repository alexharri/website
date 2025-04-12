import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision highp float;

    uniform float u_time;
    uniform float u_h;

    const float L = 0.019;
    const float S = 0.5;
    float WAVE_HEIGHT = 0.188 * u_h;

    float noise_total() {
      float x = gl_FragCoord.x;
      
      float sum = 0.0;
      sum += sin(x * (L / 1.000) + u_time *  0.90 * S) * 0.64;
      sum += sin(x * (L / 1.153) + u_time *  1.15 * S) * 0.40;
      sum += sin(x * (L / 1.622) + u_time * -0.75 * S) * 0.48;
      sum += sin(x * (L / 1.871) + u_time *  0.65 * S) * 0.43;
      sum += sin(x * (L / 2.013) + u_time * -1.05 * S) * 0.32;
      return sum;
    }

    float calc_alpha(float noise_fac, float h) {
      float waveY = u_h * 0.5 + noise_fac * WAVE_HEIGHT * h;
      float dist = waveY - gl_FragCoord.y;

      float alpha = 1.0;

      alpha *= clamp(3.7 + dist, 0.0, 1.0);
      alpha *= clamp(0.0 - dist, 0.0, 1.0);

      return alpha;
    }

    void main() {
      float alpha = 0.0;
      alpha += calc_alpha(noise_total(), 0.8);
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
