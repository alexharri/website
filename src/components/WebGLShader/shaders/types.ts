export interface FragmentShaderUniform {
  label?: string;
  value: number;
  range: [number, number];
  step?: number;
  remap?: [number, number];
  format?: "number" | "percent" | "multiplier";
  width?: "small" | "normal";
}

export type FragmentShaderUniforms = Record<string, FragmentShaderUniform>;

export type FragmentShader = {
  shader: string;
  uniforms: FragmentShaderUniforms;
};

export type CreateFragmentShader = (
  options: Partial<Record<string, unknown>>,
) => string | FragmentShader;
