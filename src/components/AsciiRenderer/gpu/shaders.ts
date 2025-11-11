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

export const SAMPLING_FRAG = /* glsl */ `#version 300 es
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

// Sampling circle positions (normalized 0-1 within cell)
uniform vec2 u_samplingPoints[6];
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
  // Determine which grid cell this fragment corresponds to
  // Flip Y because texture coords are bottom-up but grid is top-down
  vec2 texCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
  vec2 gridCoord = texCoord * u_gridSize;  // (col, row) in [0, gridSize)
  vec2 gridCell = floor(gridCoord);

  // Determine which sampling circle within the cell (0-5)
  // We'll pack 2 circles per row: circles 0,1 in row 0; circles 2,3 in row 1; circles 4,5 in row 2
  vec2 circleGridCoord = fract(gridCoord) * vec2(2.0, 3.0);
  vec2 circleCell = floor(circleGridCoord);
  int circleIndex = int(circleCell.y) * 2 + int(circleCell.x);

  if (circleIndex >= 6) {
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

export const CRUNCH_FRAG = /* glsl */ `#version 300 es
precision highp float;

// Crunch shader - combines raw and external sampling vectors and applies crunching effects

in vec2 v_texCoord;
out vec4 fragColor;

uniform sampler2D u_rawSamplingTexture;      // Raw sampling vector texture
uniform sampler2D u_externalSamplingTexture; // External sampling vector texture
uniform bool u_useGlobalCrunch;              // Enable global crunch effect
uniform bool u_useDirectionalCrunch;         // Enable directional crunch effect
uniform vec2 u_gridSize;                     // Grid dimensions (cols, rows)

// Crunch exponents (from generateAsciiChars.ts)
const float GLOBAL_CRUNCH_EXPONENT = 3.0;
const float DIRECTIONAL_CRUNCH_EXPONENT = 7.0;

// Calculate texture coordinate for a specific circle within a cell
vec2 getCircleTexCoord(vec2 gridCell, int circleIndex) {
  // Circles are packed as 2 per row, 3 rows per cell
  int circleRow = circleIndex / 2;
  int circleCol = circleIndex - (circleRow * 2);

  // gridCell is in flipped-Y space. Convert to gridCoord (fractional)
  // by adding the sub-cell position
  vec2 subCellPos = (vec2(float(circleCol), float(circleRow)) + vec2(0.5)) / vec2(2.0, 3.0);
  vec2 gridCoord = gridCell + subCellPos;

  // Convert back to texture coordinates
  vec2 texCoord = gridCoord / u_gridSize;

  // Flip Y back to get actual texture coordinate
  texCoord.y = 1.0 - texCoord.y;

  return texCoord;
}

void main() {
  // Determine which grid cell and circle this fragment corresponds to
  // Flip Y to match the sampling shader's coordinate system
  vec2 texCoord = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
  vec2 gridCoord = texCoord * u_gridSize;
  vec2 gridCell = floor(gridCoord);

  // Determine which sampling circle within the cell (0-5)
  vec2 circleGridCoord = fract(gridCoord) * vec2(2.0, 3.0);
  vec2 circleCell = floor(circleGridCoord);
  int currentCircleIndex = int(circleCell.y) * 2 + int(circleCell.x);

  if (currentCircleIndex >= 6) {
    fragColor = vec4(0.0);
    return;
  }

  // Sample current raw and external values
  vec4 rawSample = texture(u_rawSamplingTexture, v_texCoord);
  vec4 externalSample = texture(u_externalSamplingTexture, v_texCoord);

  float value = rawSample.r;
  float contextValue = externalSample.r;

  // Apply directional crunch FIRST (if enabled)
  if (u_useDirectionalCrunch && contextValue > value) {
    float normalized = value / contextValue;
    float enhanced = pow(normalized, DIRECTIONAL_CRUNCH_EXPONENT);
    value = enhanced * contextValue;
  }

  // Apply global crunch SECOND (if enabled)
  // Sample all 6 circles from the same cell to find max
  if (u_useGlobalCrunch) {
    float maxValue = 0.0;

    // Sample all 6 circles and find max
    for (int i = 0; i < 6; i++) {
      vec2 circleTexCoord = getCircleTexCoord(gridCell, i);
      float circleValue = texture(u_rawSamplingTexture, circleTexCoord).r;

      // Apply directional crunch to this sample if enabled
      if (u_useDirectionalCrunch) {
        float circleContextValue = texture(u_externalSamplingTexture, circleTexCoord).r;

        if (circleContextValue > circleValue) {
          float normalized = circleValue / circleContextValue;
          float enhanced = pow(normalized, DIRECTIONAL_CRUNCH_EXPONENT);
          circleValue = enhanced * circleContextValue;
        }
      }

      // Update value for current circle
      if (i == currentCircleIndex) {
        value = circleValue;
      }

      maxValue = max(maxValue, circleValue);
    }

    // Apply global crunch using max across all 6 circles
    if (maxValue > 0.0) {
      float normalized = value / maxValue;
      float enhanced = pow(normalized, GLOBAL_CRUNCH_EXPONENT);
      value = enhanced * maxValue;
    }
  }

  // Output final value
  fragColor = vec4(value, 0.0, 0.0, 1.0);
}
`;
