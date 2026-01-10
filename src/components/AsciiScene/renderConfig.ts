import { AlphabetName, getAlphabetMetadata } from "./alphabets/AlphabetManager";

export class AsciiRenderConfig {
  public sampleRectWidth: number;
  public sampleRectHeight: number;
  public boxWidth: number;
  public boxHeight: number;
  public sampleRectXOff: number;
  public sampleRectYOff: number;
  public cols: number;
  public rows: number;
  public offsetX: number;
  public offsetY: number;
  public samplePointRadius: number;
  public letterSpacingEm: number;
  public lineHeight: number;
  public asciiXOffset: number;

  constructor(
    public canvasWidth: number,
    public canvasHeight: number,
    public fontSize: number,
    public characterWidth: number,
    public alphabet: AlphabetName,
    public samplingQuality: number,
    public exclude: string,
    characterWidthMultiplier: number,
    characterHeightMultiplier: number,
    offsetAlign: "left" | "center",
  ) {
    const metadata = getAlphabetMetadata(alphabet);

    this.sampleRectWidth = fontSize * metadata.width;
    this.sampleRectHeight = fontSize * metadata.height;
    this.boxWidth = this.sampleRectWidth * characterWidthMultiplier;
    this.boxHeight = this.sampleRectHeight * characterHeightMultiplier;
    this.sampleRectXOff = (this.boxWidth - this.sampleRectWidth) / 2;
    this.sampleRectYOff = (this.boxHeight - this.sampleRectHeight) / 2;

    this.samplePointRadius = fontSize * metadata.samplingConfig.circleRadius;

    this.cols = Math.ceil(canvasWidth / this.boxWidth);
    this.rows = Math.ceil(canvasHeight / this.boxHeight);
    if (this.cols % 2 === 0) this.cols += 1;
    if (this.rows % 2 === 0) this.rows += 1;

    if (offsetAlign === "center") {
      const centerColX = (this.cols / 2) * this.boxWidth;
      const centerRowY = (this.rows / 2) * this.boxHeight;

      this.offsetX = this.canvasWidth / 2 - centerColX;
      this.offsetY = this.canvasHeight / 2 - centerRowY;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }

    this.letterSpacingEm = metadata.width * characterWidthMultiplier - this.characterWidth;
    this.lineHeight = metadata.height * characterHeightMultiplier;

    this.asciiXOffset = (this.letterSpacingEm * this.fontSize) / 2;
  }

  public sampleRectPosition(col: number, row: number): [x: number, y: number] {
    const x = col * this.boxWidth + this.offsetX + this.sampleRectXOff;
    const y = row * this.boxHeight + this.offsetY + this.sampleRectYOff;
    return [x, y];
  }

  public samplingCircleOffset(point: { x: number; y: number }) {
    const x = point.x * this.sampleRectWidth;
    const y = point.y * this.sampleRectHeight;
    return [x, y];
  }

  public generateCircleSamplingPoints(): { x: number; y: number }[] {
    const points = getSamplePoints(this.samplingQuality);
    return points.map(({ x, y }) => {
      x *= this.samplePointRadius;
      y *= this.samplePointRadius;
      return { x, y };
    });
  }
}

function getSamplePoints(quality: number): { x: number; y: number }[] {
  if (quality === 1) {
    return [{ x: 0, y: 0 }]; // Circle center
  }
  if (quality === 2) {
    return [
      { x: 0.5, y: 0.3 },
      { x: -0.5, y: -0.3 },
    ];
  }
  if (quality === 3) {
    return [
      { x: 0.47, y: 0.5 },
      { x: -0.47, y: 0 },
      { x: 0.47, y: -0.5 },
    ];
  }
  if (quality === 4) {
    return [
      { x: 0.45, y: 0.45 },
      { x: 0.45, y: -0.45 },
      { x: -0.45, y: 0.45 },
      { x: -0.45, y: -0.45 },
    ];
  }

  const points: { x: number; y: number }[] = [];

  const goldenAngleRad = Math.PI * (3 - Math.sqrt(5)); // "Golden angle" in radians

  // 0.5 = uniform area, >0.5 = more center, <0.5 = more edge
  const RADIAL_DISTRIBUTION_EXPONENT = 0.5;

  for (let i = 0; i < quality; i++) {
    const theta = i * goldenAngleRad;

    const r = Math.pow((i + 0.5) / quality, RADIAL_DISTRIBUTION_EXPONENT);

    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta);

    points.push({ x, y });
  }

  return points;
}
