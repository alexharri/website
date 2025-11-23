// Shader source code for GPU-accelerated sampling

export const PASSTHROUGH_VERT = /* glsl */ `#version 300 es

// Fullscreen quad vertex shader
// Outputs: clip space coordinates and texture coordinates

in vec2 a_position;  // Vertex position (-1 to 1)

out vec2 v_texCoord;  // Texture coordinates (0 to 1)

void main() {
  // Pass through position
  gl_Position = vec4(a_position, 0.0, 1.0);

  // Convert from clip space (-1 to 1) to texture space (0 to 1)
  v_texCoord = a_position * 0.5 + 0.5;
}
`;

export const createSamplingFragmentShader = (numCircles: number) => /* glsl */ `#version 300 es
precision highp float;

// Raw sampling shader - samples internal circles and outputs averaged lightness values

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_canvasTexture;      // Input canvas RGBA texture
uniform sampler2D u_easingLUT;          // 1D easing lookup table (512x1)
uniform vec2 u_canvasSize;              // Canvas dimensions in pixels
uniform vec2 u_gridSize;                // Grid dimensions (cols, rows)
uniform vec2 u_boxSize;                 // Cell size in pixels (boxWidth, boxHeight)
uniform vec2 u_gridOffset;              // Grid offset (offsetX, offsetY)
uniform float u_pixelBufferScale;       // Scale factor for canvas resolution
uniform bool u_flipY;                   // Vertical flip flag
uniform int u_samplingQuality;          // Number of subsamples per circle (typically 3)
uniform int u_numCircles;               // Number of sampling circles per cell (1-6)

// Sampling circle positions (normalized 0-1 within cell)
uniform vec2 u_samplingPoints[${numCircles}];
uniform float u_circleRadius;           // Radius of sampling circles (normalized)

// Constants for lightness conversion (Rec. 709)
const vec3 LIGHTNESS_WEIGHTS = vec3(0.2126, 0.7152, 0.0722);

// Golden ratio for Vogel's method subsample distribution
const float PHI = 1.618033988749895;
const float GOLDEN_ANGLE = 3.883222077450933;  // 2π / φ²

// Convert RGB to lightness
float rgbToLightness(vec3 rgb) {
  return dot(rgb, LIGHTNESS_WEIGHTS);
}

// Apply easing function via lookup table
float applyEasing(float value) {
  // Clamp to [0, 1]
  float clamped = clamp(value, 0.0, 1.0);

  // Sample from 1D LUT (512 entries)
  float texCoord = clamped * (511.0 / 512.0) + (0.5 / 512.0);
  return texture(u_easingLUT, vec2(texCoord, 0.5)).r;
}

// Sample a single point from the canvas
float samplePoint(vec2 pixelCoord) {
  // Apply flip if needed
  vec2 coord = pixelCoord;
  if (u_flipY) {
    coord.y = u_canvasSize.y - coord.y;
  }

  // Clamp to canvas bounds
  coord = clamp(coord, vec2(0.0), u_canvasSize - vec2(1.0));

  // Convert to texture coordinates
  vec2 texCoord = coord / u_canvasSize;

  // Sample and convert to lightness
  vec3 rgb = texture(u_canvasTexture, texCoord).rgb;
  float lightness = rgbToLightness(rgb);

  // Apply easing
  return applyEasing(lightness);
}

// Sample a circular region using Vogel's method
float sampleCircularRegion(vec2 centerPixel, float radiusPixels) {
  if (u_samplingQuality == 1) {
    // Single center sample
    return samplePoint(centerPixel);
  }

  float sum = 0.0;

  for (int i = 0; i < 16; i++) {  // Max quality, will break early
    if (i >= u_samplingQuality) break;

    if (i == 0) {
      // Center point
      sum += samplePoint(centerPixel);
    } else {
      // Vogel's method: golden angle spiral
      float angle = float(i) * GOLDEN_ANGLE;
      float radius = radiusPixels * sqrt(float(i) / float(u_samplingQuality));

      vec2 offset = vec2(cos(angle), sin(angle)) * radius;
      sum += samplePoint(centerPixel + offset);
    }
  }

  return sum / float(u_samplingQuality);
}

void main() {
  // Determine which pixel we're rendering in the output texture
  // Output texture is (cols * numCircles) × rows
  float pixelX = v_texCoord.x * u_gridSize.x * float(u_numCircles);
  float pixelY = v_texCoord.y * u_gridSize.y;

  // Determine which grid cell this pixel belongs to
  float col = floor(pixelX / float(u_numCircles));
  float row = floor(pixelY);

  // Flip Y to match grid coordinate system (top-down)
  vec2 gridCell = vec2(col, u_gridSize.y - 1.0 - row);

  // Determine which sampling circle within the cell
  int circleIndex = int(mod(pixelX, float(u_numCircles)));

  if (circleIndex >= u_numCircles) {
    // Out of bounds
    fragColor = vec4(0.0);
    return;
  }

  // Calculate the pixel position of the cell's top-left corner
  vec2 cellTopLeft = gridCell * u_boxSize + u_gridOffset;

  // Get the sampling point position (normalized within cell)
  vec2 samplingPoint = u_samplingPoints[circleIndex];

  // Convert to pixel coordinates
  vec2 samplingPixel = cellTopLeft + samplingPoint * u_boxSize;

  // Apply pixel buffer scale
  samplingPixel *= u_pixelBufferScale;

  // Calculate circle radius in pixels
  float radiusPixels = u_circleRadius * min(u_boxSize.x, u_boxSize.y) * u_pixelBufferScale;

  // Sample the circular region
  float value = sampleCircularRegion(samplingPixel, radiusPixels);

  // Output as RGBA (we'll pack multiple values per pixel in the main class)
  // For now, output to red channel
  fragColor = vec4(value, 0.0, 0.0, 1.0);
}
`;

export const createMaxValueFragmentShader = (numCircles: number) => /* glsl */ `#version 300 es
precision highp float;

// Max value shader - computes the maximum value across all circles in each cell

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_rawSamplingTexture;  // Raw sampling vector texture
uniform vec2 u_gridSize;                 // Grid dimensions (cols, rows)
uniform int u_numCircles;                // Number of sampling circles per cell (1-6)

// Calculate texture coordinate for a specific circle within a cell
vec2 getCircleTexCoord(vec2 gridCell, int circleIndex) {
  // Circles are packed horizontally: N pixels per cell in a row
  // gridCell is in flipped-Y space

  // Add fractional offset for the circle within the cell
  float circleOffset = (float(circleIndex) + 0.5) / float(u_numCircles);
  vec2 gridCoord = gridCell + vec2(circleOffset, 0.5);

  // Convert back to texture coordinates
  vec2 texCoord = gridCoord / u_gridSize;

  // Flip Y back to get actual texture coordinate
  texCoord.y = 1.0 - texCoord.y;

  return texCoord;
}

void main() {
  // Output texture is cols × rows (one pixel per cell)
  // Determine which grid cell this fragment corresponds to
  float col = floor(v_texCoord.x * u_gridSize.x);
  float row = floor(v_texCoord.y * u_gridSize.y);

  // Flip Y to match grid coordinate system (top-down)
  vec2 gridCell = vec2(col, u_gridSize.y - 1.0 - row);

  // Find max value across all circles in this cell
  float maxValue = 0.0;

  for (int i = 0; i < ${numCircles}; i++) {
    vec2 circleTexCoord = getCircleTexCoord(gridCell, i);
    float circleValue = texture(u_rawSamplingTexture, circleTexCoord).r;
    maxValue = max(maxValue, circleValue);
  }

  // Output max value
  fragColor = vec4(maxValue, 0.0, 0.0, 1.0);
}
`;

export const createDirectionalCrunchFragmentShader = () => /* glsl */ `#version 300 es
precision highp float;

// Directional crunch shader - applies directional crunch effect based on external context

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_inputTexture;            // Input texture from previous pass
uniform sampler2D u_externalSamplingTexture; // External sampling vector texture
uniform vec2 u_gridSize;                     // Grid dimensions (cols, rows)
uniform int u_numCircles;                    // Number of sampling circles per cell (1-6)
uniform float u_directionalCrunchExponent;   // Crunch exponent (variable)

void main() {
  // Sample input and external values at current fragment
  float value = texture(u_inputTexture, v_texCoord).r;
  float contextValue = texture(u_externalSamplingTexture, v_texCoord).r;

  // Apply directional crunch: enhance contrast when context > value
  if (contextValue > value) {
    float normalized = value / contextValue;
    float enhanced = pow(normalized, u_directionalCrunchExponent);
    value = enhanced * contextValue;
  }

  // Output crunched value
  fragColor = vec4(value, 0.0, 0.0, 1.0);
}
`;

export const createGlobalCrunchFragmentShader = () => /* glsl */ `#version 300 es
precision highp float;

// Global crunch shader - applies global crunch effect based on cell max values

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_inputTexture;    // Input texture from previous pass
uniform sampler2D u_maxValueTexture; // Max value texture (cols × rows)
uniform vec2 u_gridSize;             // Grid dimensions (cols, rows)
uniform int u_numCircles;            // Number of sampling circles per cell (1-6)
uniform float u_globalCrunchExponent; // Crunch exponent (variable)

void main() {
  // Determine which grid cell this fragment corresponds to
  float pixelX = v_texCoord.x * u_gridSize.x * float(u_numCircles);
  float pixelY = v_texCoord.y * u_gridSize.y;

  float col = floor(v_texCoord.x * u_gridSize.x);
  float row = floor(v_texCoord.y * u_gridSize.y);

  // Calculate texture coordinate for the cell's max value
  vec2 cellTexCoord = (vec2(col, row) + vec2(0.5)) / u_gridSize;

  // Sample input value and max value
  float value = texture(u_inputTexture, v_texCoord).r;
  float maxValue = texture(u_maxValueTexture, cellTexCoord).r;

  // Apply global crunch: normalize by max and enhance contrast
  if (maxValue > 0.0) {
    float normalized = value / maxValue;
    float enhanced = pow(normalized, u_globalCrunchExponent);
    value = enhanced * maxValue;
  }

  // Output crunched value
  fragColor = vec4(value, 0.0, 0.0, 1.0);
}
`;

export const COPY_FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;

// Simple copy shader - copies input texture to output

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_inputTexture;

void main() {
  fragColor = texture(u_inputTexture, v_texCoord);
}
`;
