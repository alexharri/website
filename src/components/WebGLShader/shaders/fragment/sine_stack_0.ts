import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  return /* glsl */ `
    precision mediump float;

    uniform float u_time;

    const float HEIGHT = 200.0;
    const float PI = 3.14159, TAU = PI * 2.0;
    const float WAVE_HEIGHT = 32.0;

    float noise(float x) {
      const float L = 0.011;
      const float S = 0.28;
      
      float sum = 0.0;
      sum += sin(x * L * 1.0 + u_time * 1.0 * S) * 1.0;
      
      // up-down wave
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
};

export default createFragmentShader;
