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
import wave_animated_blur_down from "./fragment/wave_animated_blur_down";
import wave_animated_blur_down_even from "./fragment/wave_animated_blur_down_even";
import sine_stack_final from "./fragment/sine_stack_final";
import sine_stack_0 from "./fragment/sine_stack_0";
import sine_stack_1 from "./fragment/sine_stack_1";
import sine_stack_2 from "./fragment/sine_stack_2";
import sine_stack_3 from "./fragment/sine_stack_3";
import sine_stack_4 from "./fragment/sine_stack_4";
import simplex_wave from "./fragment/simplex_wave";
import simplex_stack_final from "./fragment/simplex_stack_final";
import simplex_stack_0 from "./fragment/simplex_stack_0";
import simplex_stack_1 from "./fragment/simplex_stack_1";

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
  wave_animated_blur_down,
  wave_animated_blur_down_even,
  sine_stack_final,
  sine_stack_0,
  sine_stack_1,
  sine_stack_2,
  sine_stack_3,
  sine_stack_4,
  simplex_wave,
  simplex_stack_final,
  simplex_stack_0,
  simplex_stack_1,
};
