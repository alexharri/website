import final from "./fragment/final";
import { CreateFragmentShader } from "./types";

export const fragmentShaderRegistry: Partial<Record<string, CreateFragmentShader>> = {
  final,
};
