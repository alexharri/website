import { CreateFragmentShader } from "./types";
import final from "./fragment/final";
import x_lerp from "./fragment/x_lerp";
import xy_lerp from "./fragment/xy_lerp";
import x_sine_lerp from "./fragment/x_sine_lerp";
import x_sine_lerp_time from "./fragment/x_sine_lerp_time";
import sine_wave from "./fragment/sine_wave";
import single_color from "./fragment/single_color";
import linear_gradient from "./fragment/linear_gradient";
import linear_gradient_area_under_line from "./fragment/linear_gradient_area_under_line";
import linear_gradient_area_under_wave from "./fragment/linear_gradient_area_under_wave";
import linear_gradient_area_under_wave_2 from "./fragment/linear_gradient_area_under_wave_2";
import wave_animated_slow from "./fragment/wave_animated_slow";
import wave_animated from "./fragment/wave_animated";
import wave_animated_blur_left_to_right from "./fragment/wave_animated_blur_left_to_right";

export const fragmentShaderRegistry: Partial<Record<string, CreateFragmentShader>> = {
  final,
  x_lerp,
  xy_lerp,
  x_sine_lerp,
  x_sine_lerp_time,
  sine_wave,
  single_color,
  linear_gradient,
  linear_gradient_area_under_line,
  linear_gradient_area_under_wave,
  linear_gradient_area_under_wave_2,
  wave_animated_slow,
  wave_animated,
  wave_animated_blur_left_to_right,
};
