import { createCanvas, Canvas, registerFont } from "canvas";
import * as fs from "fs";
import * as path from "path";

export interface SamplingPoint {
  x: number; // 0-1 normalized coordinate
  y: number; // 0-1 normalized coordinate
}

export interface SamplingConfig {
  points: SamplingPoint[];
  externalPoints: SamplingPoint[];
  circleRadius: number; // radius in pixels
}

export class AsciiRenderer {
  private width: number;
  private height: number;
  private samplingConfig: SamplingConfig;
  private fontFamily: string;
  private fontSize: number;
  private customFontPaths: { [key: string]: string[] };
  private blurRadius: number;

  constructor(
    width: number = 48,
    height: number = 64,
    samplingConfig: SamplingConfig,
    fontFamily: string = "monospace",
    fontSize: number = 32,
    customFontPaths: { [key: string]: string[] } = {},
    blurRadius: number = 0,
  ) {
    this.width = width;
    this.height = height;
    this.samplingConfig = samplingConfig;
    this.fontFamily = fontFamily;
    this.fontSize = fontSize;
    this.customFontPaths = customFontPaths;
    this.blurRadius = blurRadius;

    // Try to register custom fonts if needed
    this.tryRegisterCustomFonts();
  }

  private tryRegisterCustomFonts(): void {
    // Check if any custom fonts need to be registered
    for (const [fontName, paths] of Object.entries(this.customFontPaths)) {
      if (this.fontFamily.includes(fontName)) {
        this.registerFont(fontName, paths);
      }
    }
  }

  private registerFont(fontName: string, fontPaths: string[]): void {
    let fontFound = false;
    for (const fontPath of fontPaths) {
      if (fs.existsSync(fontPath)) {
        try {
          registerFont(fontPath, { family: fontName });
          console.log(`✓ Registered ${fontName} font from: ${fontPath}`);
          fontFound = true;
          break;
        } catch (err) {
          console.error(`Failed to register font from ${fontPath}:`, err);
        }
      }
    }

    if (!fontFound) {
      throw new Error(`${fontName} font not found. Tried paths: ${fontPaths.join(", ")}`);
    }
  }

  renderCharacter(char: string): Canvas {
    const canvas = createCanvas(this.width, this.height);
    const ctx = canvas.getContext("2d");

    // Set black background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, this.width, this.height);

    // Configure font
    ctx.fillStyle = "white";
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Center the character
    const x = this.width / 2;
    const y = this.height / 2;

    ctx.fillText(char, x, y);

    // Apply blur if configured
    if (this.blurRadius > 0) {
      this.applyGaussianBlur(canvas, this.blurRadius);
    }

    return canvas;
  }

  private applyGaussianBlur(canvas: Canvas, radius: number): void {
    if (radius <= 0) return;

    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, this.width, this.height);
    const data = imageData.data;

    // Create Gaussian kernel
    const kernel = this.createGaussianKernel(radius);
    const kernelSize = kernel.length;
    const kernelRadius = Math.floor(kernelSize / 2);

    // Create a copy of the original data
    const originalData = new Uint8ClampedArray(data);

    // Apply horizontal blur
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          a = 0;

        for (let kx = -kernelRadius; kx <= kernelRadius; kx++) {
          const px = Math.min(this.width - 1, Math.max(0, x + kx));
          const idx = (y * this.width + px) * 4;
          const weight = kernel[kx + kernelRadius];

          r += originalData[idx] * weight;
          g += originalData[idx + 1] * weight;
          b += originalData[idx + 2] * weight;
          a += originalData[idx + 3] * weight;
        }

        const idx = (y * this.width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }

    // Copy blurred data for vertical pass
    originalData.set(data);

    // Apply vertical blur
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        let r = 0,
          g = 0,
          b = 0,
          a = 0;

        for (let ky = -kernelRadius; ky <= kernelRadius; ky++) {
          const py = Math.min(this.height - 1, Math.max(0, y + ky));
          const idx = (py * this.width + x) * 4;
          const weight = kernel[ky + kernelRadius];

          r += originalData[idx] * weight;
          g += originalData[idx + 1] * weight;
          b += originalData[idx + 2] * weight;
          a += originalData[idx + 3] * weight;
        }

        const idx = (y * this.width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = a;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private createGaussianKernel(radius: number): number[] {
    const size = Math.ceil(radius * 2) * 2 + 1;
    const kernel = new Array(size);
    const sigma = radius / 3;
    const sigma2 = 2 * sigma * sigma;
    const sqrtSigmaPi2 = Math.sqrt(sigma2 * Math.PI);
    const center = Math.floor(size / 2);
    let sum = 0;

    for (let i = 0; i < size; i++) {
      const x = i - center;
      const g = Math.exp(-(x * x) / sigma2) / sqrtSigmaPi2;
      kernel[i] = g;
      sum += g;
    }

    // Normalize kernel
    for (let i = 0; i < size; i++) {
      kernel[i] /= sum;
    }

    return kernel;
  }

  private calculateCircleLightness(
    canvas: Canvas,
    centerX: number,
    centerY: number,
    radius: number,
  ): number {
    const ctx = canvas.getContext("2d");
    const startX = Math.max(0, Math.floor(centerX - radius));
    const startY = Math.max(0, Math.floor(centerY - radius));
    const endX = Math.min(this.width, Math.ceil(centerX + radius));
    const endY = Math.min(this.height, Math.ceil(centerY + radius));

    const imageData = ctx.getImageData(startX, startY, endX - startX, endY - startY);
    const data = imageData.data;
    const width = endX - startX;

    let totalLightness = 0;
    let pixelCount = 0;

    for (let y = 0; y < endY - startY; y++) {
      for (let x = 0; x < width; x++) {
        const pixelX = startX + x;
        const pixelY = startY + y;

        // Check if pixel is within circle
        const dx = pixelX - centerX;
        const dy = pixelY - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= radius) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          totalLightness += lightness;
          pixelCount++;
        }
      }
    }

    return pixelCount > 0 ? totalLightness / pixelCount : 0;
  }

  generateLightnessVector(char: string): number[] {
    const canvas = this.renderCharacter(char);
    const vector: number[] = [];

    for (const point of this.samplingConfig.points) {
      const centerX = point.x * this.width;
      const centerY = point.y * this.height;

      const lightness = this.calculateCircleLightness(
        canvas,
        centerX,
        centerY,
        this.samplingConfig.circleRadius,
      );
      vector.push(lightness);
    }

    return vector;
  }

  static normalizeVectorsGlobally(vectors: number[][]) {
    const K = vectors[0].length;
    const maxValues: number[] = vectors[0].map(() => 0);

    for (const vector of vectors) {
      for (let i = 0; i < K; i++) {
        maxValues[i] = Math.max(maxValues[i], vector[i]);
      }
    }

    const maxValue = Math.max(...maxValues);
    const scalars = maxValues.map((v) => 1 / v);

    for (const vector of vectors) {
      for (let i = 0; i < K; i++) {
        vector[i] = vector[i] * scalars[i];
        // vector[i] = vector[i] / maxValue;
      }
    }
  }

  generateDebugImage(char: string, normalizedVector: number[], outputDir: string = "debug"): void {
    // Ensure debug directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const originalCanvas = this.renderCharacter(char);
    const vector = normalizedVector;

    // Create visualization canvas (original + sampling visualization side by side)
    const padding = 10;
    const spacing = 10; // reduced from 20px
    const debugWidth = this.width * 2 + spacing + padding * 2;
    const debugHeight = this.height + 40 + padding * 2;
    const debugCanvas = createCanvas(debugWidth, debugHeight);
    const debugCtx = debugCanvas.getContext("2d");

    // Set background
    debugCtx.fillStyle = "#222222";
    debugCtx.fillRect(0, 0, debugWidth, debugHeight);

    // Add original image on the left
    debugCtx.drawImage(originalCanvas, padding, 20 + padding);

    // Create sampling visualization on the right
    const samplingCanvas = createCanvas(this.width, this.height);
    const samplingCtx = samplingCanvas.getContext("2d");

    // Set black background for sampling visualization
    samplingCtx.fillStyle = "black";
    samplingCtx.fillRect(0, 0, this.width, this.height);

    // Draw sampling circles
    for (let i = 0; i < this.samplingConfig.points.length; i++) {
      const point = this.samplingConfig.points[i];
      const centerX = point.x * this.width;
      const centerY = point.y * this.height;
      const lightness = vector[i];
      const grayValue = Math.floor(lightness * 255);

      // Fill circle with lightness value
      samplingCtx.beginPath();
      samplingCtx.arc(centerX, centerY, this.samplingConfig.circleRadius, 0, 2 * Math.PI);
      samplingCtx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
      samplingCtx.fill();

      // Draw circle outline
      samplingCtx.strokeStyle = "#666666";
      samplingCtx.lineWidth = 1;
      samplingCtx.stroke();
    }

    // Add sampling visualization to the right side
    debugCtx.drawImage(samplingCanvas, this.width + spacing + padding, 20 + padding);

    // Add labels
    debugCtx.fillStyle = "white";
    debugCtx.font = "16px monospace";
    debugCtx.fillText(`Original: '${char}'`, padding, 15 + padding);
    debugCtx.fillText(
      `Sampling (${this.samplingConfig.points.length} points)`,
      this.width + spacing + padding,
      15 + padding,
    );

    // Add vector values as text at the bottom
    const vectorText = `Vector: [${vector.map((v) => v.toFixed(3)).join(", ")}]`;
    if (vectorText.length < 80) {
      // Only show if it fits reasonably
      debugCtx.fillText(vectorText, padding, this.height + 35 + padding);
    }

    // Save the debug image
    const charCode = char.charCodeAt(0);
    const filename =
      char === " "
        ? "space.png"
        : char.match(/[a-zA-Z0-9]/)
        ? `${char}.png`
        : `char_${charCode}.png`;

    const outputPath = path.join(outputDir, filename);
    const buffer = debugCanvas.toBuffer("image/png");
    fs.writeFileSync(outputPath, buffer);
  }

  static createCompositeDebugImage(debugDir: string) {
    if (!fs.existsSync(debugDir)) {
      console.warn(`Debug directory ${debugDir} does not exist`);
      return;
    }

    const files = fs.readdirSync(debugDir).filter((f) => f.endsWith(".png"));
    if (files.length === 0) {
      console.warn("No debug images found to combine");
      return;
    }

    // Calculate grid dimensions
    const cols = Math.ceil(Math.sqrt(files.length));
    const rows = Math.ceil(files.length / cols);

    // Load first image to get dimensions
    const firstImagePath = path.join(debugDir, files[0]);
    const firstImageBuffer = fs.readFileSync(firstImagePath);

    // Create a temporary canvas to load the first image and get its dimensions
    const tempImg = new (require("canvas").Image)();
    tempImg.src = firstImageBuffer;

    const imageWidth = tempImg.width;
    const imageHeight = tempImg.height;

    // Create composite canvas
    const compositeWidth = cols * imageWidth;
    const compositeHeight = rows * imageHeight;
    const compositeCanvas = createCanvas(compositeWidth, compositeHeight);
    const compositeCtx = compositeCanvas.getContext("2d");

    // Fill background
    compositeCtx.fillStyle = "#000000";
    compositeCtx.fillRect(0, 0, compositeWidth, compositeHeight);

    // Place each image in the grid
    files.forEach((filename, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = col * imageWidth;
      const y = row * imageHeight;

      const imagePath = path.join(debugDir, filename);
      const imageBuffer = fs.readFileSync(imagePath);
      const img = new (require("canvas").Image)();
      img.src = imageBuffer;

      compositeCtx.drawImage(img, x, y);
    });

    // Save composite image
    const compositeBuffer = compositeCanvas.toBuffer("image/png");
    const compositeOutputPath = path.join(debugDir, "composite.png");
    fs.writeFileSync(compositeOutputPath, compositeBuffer);

    console.log(`Created composite debug image: ${compositeOutputPath}`);
    console.log(`Combined ${files.length} images in a ${cols}x${rows} grid`);
  }
}
