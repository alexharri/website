import { CreateFragmentShader } from "./types";
import final from "./fragment/final";
import x_lerp from "./fragment/x_lerp";
import xy_lerp from "./fragment/xy_lerp";
import x_sine_lerp from "./fragment/x_sine_lerp";

export const fragmentShaderRegistry: Partial<Record<string, CreateFragmentShader>> = {
  final,
  x_lerp,
  xy_lerp,
  x_sine_lerp,
};
