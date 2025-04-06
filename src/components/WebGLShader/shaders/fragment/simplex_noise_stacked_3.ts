import { noiseUtils } from "../utils/noiseUtils";
import { simplex_noise } from "../utils/simplexNoise";
import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_time;

    ${noiseUtils}
    ${simplex_noise}

    float smoothstep(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    vec3 calc_color(float t) {
      const vec3 color1 = vec3(0.031, 0.0, 0.561);
      const vec3 color2 = vec3(0.980, 0.0, 0.125);
      const vec3 color3 = vec3(1.0,   0.8, 0.169);
      vec3 color = color1;
      color = mix(color, color2, min(1.0, t * 2.0));
      color = mix(color, color3, max(0.0, (t - 0.5) * 2.0));
      return color;
    }

    void main() {
      float L = 0.0015;
      const float F = 0.11;
      const float S = 0.13;
      const float Y_SCALE = 3.0;

      vec3 red  = vec3(1.0, 0.0, 0.0);
      vec3 blue = vec3(0.0, 0.0, 1.0);
      
      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y * Y_SCALE;
      
      const float O1 = 138.0;
      const float O2 = 39.7;
      const float O3 = 258.2;

      float sum = 0.5; // Start at 50% lightness
      sum += simplex_noise(vec3(x * L * 1.0 +  F * 1.0, y * L * 1.00, u_time * S + O1)) * 0.30;
      sum += simplex_noise(vec3(x * L * 0.6 + -F * 0.6, y * L * 0.85, u_time * S + O2)) * 0.26;
      sum += simplex_noise(vec3(x * L * 0.4 +  F * 0.8, y * L * 0.70, u_time * S + O3)) * 0.22;

      float t = clamp(sum, 0.0, 1.0);
      vec3 color = calc_color(t);
      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
