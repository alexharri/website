import { noiseUtils } from "../utils/noiseUtils";
import { simplex_noise } from "../utils/simplexNoise";
import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  return /* glsl */ `
    precision highp float;

    uniform float u_time;
    uniform float u_h;
    
    float WAVE_HEIGHT = u_h * 0.2;
    
    ${noiseUtils}
    ${simplex_noise}

    void main() {
      const float L = 0.0018;
      const float S = 0.12;
      float t = simplex_noise(vec2(gl_FragCoord.x * L, u_time * S));

      float curve_y = u_h / 2.0 + t * WAVE_HEIGHT;
      float dist = curve_y - gl_FragCoord.y;
      float alpha = clamp(0.5 + dist, 0.0, 1.0);

      vec3 fg_lower = vec3(0.965,0.992,0.745);
      vec3 fg_upper = vec3(1.0,0.702,0.443);
      vec3 bg_lower = vec3(0.91,0.604,0.412);
      vec3 bg_upper = vec3(0.647,0.314,0.204);

      float t_y = gl_FragCoord.y / u_h;
      vec3 fg_color = mix(fg_lower, fg_upper, t_y);
      vec3 bg_color = mix(bg_lower, bg_upper, t_y);
      
      vec3 color = mix(fg_color, bg_color, alpha);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;
