import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  const uniforms: FragmentShaderUniforms = {
    time: {
      label: "Animation speed",
      value: 1,
      range: [1, 10],
      format: "multiplier",
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;

    const float HEIGHT = 200.0;
    const float PI = 3.14159, TAU = PI * 2.0;
    const float WAVE_HEIGHT = 32.0;

    float noise(float x) {
      const float L = 0.011;
      const float S = 0.28;
      
      float sum = 0.0;
      sum += sin(x * (L / 1.000) + u_time *  0.90 * S) * 0.64;
      sum += sin(x * (L / 1.153) + u_time *  1.15 * S) * 0.40;
      sum += sin(x * (L / 1.622) + u_time * -0.75 * S) * 0.48;
      sum += sin(x * (L / 1.871) + u_time *  0.65 * S) * 0.43;
      sum += sin(x * (L / 2.013) + u_time * -1.05 * S) * 0.32;
      return sum;
    }

    void main() {
      float x = gl_FragCoord.x;

      float waveY = HEIGHT / 2.0 + noise(x) * WAVE_HEIGHT;
      
      vec3 foreground_lower = vec3(0.965,0.992,0.745);
      vec3 foreground_upper = vec3(1.0,0.702,0.443);
      vec3 background_lower = vec3(0.91,0.604,0.412);
      vec3 background_upper = vec3(0.647,0.314,0.204);
      
      float t_y = gl_FragCoord.y / HEIGHT;
      vec3 foreground_color = mix(foreground_lower, foreground_upper, t_y);
      vec3 background_color = mix(background_lower, background_upper, t_y);

      float dist_signed = waveY - gl_FragCoord.y;
      float fg_alpha = clamp(0.5 + dist_signed, 0.0, 1.0);
      vec3 color = mix(foreground_color, background_color, fg_alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;