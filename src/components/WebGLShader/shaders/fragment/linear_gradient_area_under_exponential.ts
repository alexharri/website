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
    const float CANVAS_WIDTH = 150.0;
    const float Y = 0.2 * CANVAS_HEIGHT;
    float I = u_incline;
    const vec3 white = vec3(1.0, 1.0, 1.0);

    void main() {
      vec3 color_1 = vec3(0.7, 0.1, 0.4);
      vec3 color_2 = vec3(0.9, 0.6, 0.1);

      float x = gl_FragCoord.x - CANVAS_WIDTH / 2.0;
      float y = gl_FragCoord.y;
      float t = y / (CANVAS_HEIGHT - 1.0);

      vec3 color = mix(color_1, color_2, t);

      // Y position of curve at current X coordinate
      float curve_y = Y + pow(x, 2.0) / 40.0;
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
