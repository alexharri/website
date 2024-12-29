import { CreateFragmentShader, FragmentShaderUniforms } from "../types";

const createFragmentShader: CreateFragmentShader = (_) => {
  const uniforms: FragmentShaderUniforms = {
    u_incline: {
      label: "Incline",
      value: 0.2,
      range: [-1, 1],
    },
  };
  const shader = /* glsl */ `
    precision mediump float;

    uniform float u_incline;

    const float CANVAS_HEIGHT = 150.0;
    const float LINE_Y_FAC = 0.4; // 40%
    float LINE_INCLINE = u_incline;
    const vec3 white = vec3(1.0, 1.0, 1.0);

    void main() {
      vec3 color_1 = vec3(0.7, 0.1, 0.4);
      vec3 color_2 = vec3(0.9, 0.6, 0.1);

      float x = gl_FragCoord.x;
      float y = gl_FragCoord.y;
      float t = y / (CANVAS_HEIGHT - 1.0);

      vec3 color = mix(color_1, color_2, t);

      // Y position of curve at current X coordinate
      float curve_y = CANVAS_HEIGHT * LINE_Y_FAC + x * LINE_INCLINE;
      float dist = curve_y - y;
      float dist_sign = sign(dist);
      float alpha = (dist_sign + 1.0) / 2.0;

      color = mix(color, white, alpha);

      gl_FragColor = vec4(color, 1.0);
    }
  `;
  return { shader, uniforms };
};

export default createFragmentShader;
