import { noiseUtils } from "../../noiseUtils";
import { simplexNoise } from "../../simplexNoise";
import { CreateFragmentShader } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  return /* glsl */ `
    precision mediump float;

    uniform float u_time;

    const float WIDTH = 200.0, HEIGHT = 150.0;
    const float PI = 3.14159, TAU = PI * 2.0;
    
    const float WAVE_HEIGHT = 40.0;
    const float WAVE_Y = HEIGHT / 2.0;
    
    ${noiseUtils}
    ${simplexNoise}

    void main() {
      const float LENGTH = 0.0018;
      const float SPEED = 0.12;
      float t = simplexNoise(vec2(gl_FragCoord.x * LENGTH, u_time * SPEED));

      float curve_y = HEIGHT / 2.0 + t * WAVE_HEIGHT;
      float dist_signed = curve_y - gl_FragCoord.y;
      float alpha = clamp(0.5 + dist_signed, 0.0, 1.0);

      vec3 fg_lower = vec3(0.965,0.992,0.745);
      vec3 fg_upper = vec3(1.0,0.702,0.443);
      vec3 bg_lower = vec3(0.91,0.604,0.412);
      vec3 bg_upper = vec3(0.647,0.314,0.204);

      float t_y = gl_FragCoord.y / HEIGHT;
      vec3 fg_color = mix(fg_lower, fg_upper, t_y);
      vec3 bg_color = mix(bg_lower, bg_upper, t_y);
      
      vec3 color = mix(fg_color, bg_color, alpha);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
};

export default createFragmentShader;
