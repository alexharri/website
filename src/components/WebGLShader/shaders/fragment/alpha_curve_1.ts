import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = () => {
  const uniforms: FragmentShaderUniforms = {};
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_w;
    uniform float u_h;

    float smoothstep(float t)
      { return t * t * t * (t * (6.0 * t - 15.0) + 10.0); }

    float v_line(float x_t, float w) {
      float curve_x = u_w * x_t;
      float dist_signed = gl_FragCoord.x - curve_x;

      float alpha = 1.0;
      alpha *= clamp(w + dist_signed, 0.0, 1.0);
      alpha *= clamp(w - dist_signed, 0.0, 1.0);
      return alpha;
    }

    void main() {
      float t = -0.2 + gl_FragCoord.x / (u_w - 1.0);
      t *= (1.0 / 0.6);
      t = clamp(t, 0.0, 1.0);

      t = smoothstep(t);
      
      float curve_y = u_h * (0.2 + t * 0.6);
      float dist_signed = (gl_FragCoord.y - curve_y) * 1.5;
      float alpha = 1.0;
      alpha *= clamp(4.0 + dist_signed, 0.0, 1.0);
      alpha *= clamp(4.0 - dist_signed, 0.0, 1.0);

      alpha += v_line(0.2, 1.0);
      alpha += v_line(0.8, 1.0);
      
      gl_FragColor = vec4(vec3(alpha), 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
