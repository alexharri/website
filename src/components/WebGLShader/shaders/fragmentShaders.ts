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
import linear_gradient_area_under_slanted_line from "./fragment/linear_gradient_area_under_slanted_line";
import linear_gradient_area_under_exponential from "./fragment/linear_gradient_area_under_exponential";
import linear_gradient_area_under_wave from "./fragment/linear_gradient_area_under_wave";
import wave_animated from "./fragment/wave_animated";
import wave_animated_2 from "./fragment/wave_animated_2";
import wave_animated_blur_left_to_right from "./fragment/wave_animated_blur_left_to_right";
import wave_animated_blur_down from "./fragment/wave_animated_blur_down";
import wave_animated_blur_down_even from "./fragment/wave_animated_blur_down_even";
import sine_stack_final from "./fragment/sine_stack_final";
import sine_stack_decomposed from "./fragment/sine_stack_decomposed";
import sine_stack_composed from "./fragment/sine_stack_composed";
import sine_stack_0 from "./fragment/sine_stack_0";
import sine_stack_1 from "./fragment/sine_stack_1";
import sine_stack_2 from "./fragment/sine_stack_2";
import sine_stack_3 from "./fragment/sine_stack_3";
import sine_stack_3_LSA from "./fragment/sine_stack_3_LSA";
import sine_stack_4 from "./fragment/sine_stack_4";
import simplex_wave from "./fragment/simplex_wave";
import simplex_over_time from "./fragment/simplex_over_time";
import simplex_stack_final from "./fragment/simplex_stack_final";
import simplex_stack_0 from "./fragment/simplex_stack_0";
import simplex_stack_1 from "./fragment/simplex_stack_1";
import multiple_waves from "./fragment/multiple_waves";
import simplex_noise from "./fragment/simplex_noise";
import simplex_perlin_split from "./fragment/simplex_perlin_split";
import simplex_noise_stacked_0 from "./fragment/simplex_noise_stacked_0";
import simplex_noise_stacked_1 from "./fragment/simplex_noise_stacked_1";
import simplex_noise_stacked_2 from "./fragment/simplex_noise_stacked_2";
import simplex_noise_stacked_3 from "./fragment/simplex_noise_stacked_3";
import simplex_noise_stacked_4 from "./fragment/simplex_noise_stacked_4";
import three_point_gradient from "./fragment/three_point_gradient";
import rainbow from "./fragment/rainbow";
import read_texture from "./fragment/read_texture";
import read_texture_t from "./fragment/read_texture_t";
import multiple_waves_blur_0 from "./fragment/multiple_waves_blur_0";
import multiple_waves_blur_1 from "./fragment/multiple_waves_blur_1";
import multiple_waves_blur_2 from "./fragment/multiple_waves_blur_2";
import multiple_waves_blur_2_side_by_side from "./fragment/multiple_waves_blur_2_side_by_side";
import multiple_waves_blur_3 from "./fragment/multiple_waves_blur_3";
import multiple_waves_blur_4 from "./fragment/multiple_waves_blur_4";
import final_effect_0 from "./fragment/final_effect_0";
import final_effect_1 from "./fragment/final_effect_1";

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
  linear_gradient_area_under_slanted_line,
  linear_gradient_area_under_exponential,
  linear_gradient_area_under_wave,
  wave_animated,
  wave_animated_2,
  wave_animated_blur_left_to_right,
  wave_animated_blur_down,
  wave_animated_blur_down_even,
  sine_stack_final,
  sine_stack_decomposed,
  sine_stack_composed,
  sine_stack_0,
  sine_stack_1,
  sine_stack_2,
  sine_stack_3,
  sine_stack_3_LSA,
  sine_stack_4,
  simplex_wave,
  simplex_over_time,
  simplex_stack_final,
  simplex_stack_0,
  simplex_stack_1,
  multiple_waves,
  simplex_noise,
  simplex_perlin_split,
  simplex_noise_stacked_0,
  simplex_noise_stacked_1,
  simplex_noise_stacked_2,
  simplex_noise_stacked_3,
  simplex_noise_stacked_4,
  three_point_gradient,
  rainbow,
  read_texture,

  read_texture_t,
  multiple_waves_blur_0,
  multiple_waves_blur_1,
  multiple_waves_blur_2,
  multiple_waves_blur_2_side_by_side,
  multiple_waves_blur_3,
  multiple_waves_blur_4,
  final_effect_0,
  final_effect_1,
};
