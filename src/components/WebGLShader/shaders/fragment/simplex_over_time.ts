import { noiseUtils } from "../utils/noiseUtils";
import { simplex_noise } from "../utils/simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;
    uniform float u_h;

    const float PI = 3.14159, TAU = PI * 2.0;
    const float WAVE_HEIGHT = 50.0;
    const float L = 0.001;
    const float S = 0.12;

    ${noiseUtils}
    ${simplex_noise}

    float noise(float l, float s, float a) {
      float x = gl_FragCoord.x;
      return sin(x * (L / l) + u_time * s * S) * a;
    }

    float noise(int i) {
      return simplex_noise(vec2(gl_FragCoord.x * L, u_time * S + float(i) * 0.035));
    }

    float calc_alpha(float noise_fac, int i) {
      float waveY = u_h * (0.52 + float(i) * 0.04) + noise_fac * WAVE_HEIGHT;
      float dist = waveY - gl_FragCoord.y;

      float alpha = 1.0;

      alpha *= clamp(3.0 + dist, 0.0, 1.0);
      alpha *= clamp(0.0 - dist, 0.0, 1.0);

      return alpha;
    }

    void main() {
      float alpha = 0.0;

      const int N = 10;
      for (int i = -N; i <= N; i++) {
        alpha += calc_alpha(noise(i), i);
      }
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
