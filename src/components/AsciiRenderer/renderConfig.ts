import { AlphabetName, getAlphabetMetadata } from "./alphabets/AlphabetManager";

export class AsciiRenderConfig {
  public sampleRectWidth: number;
  public sampleRectHeight: number;
  public boxWidth: number;
  public boxHeight: number;
  public sampleRectXOff: number;
  public sampleRectYOff: number;
  public difference: number;
  public cols: number;
  public rows: number;
  public offsetX: number;
  public offsetY: number;
  public samplePointRadius: number;
  public letterSpacingEm: number;
  public lineHeight: number;

  constructor(
    public canvasWidth: number,
    public canvasHeight: number,
    public fontSize: number,
    public characterWidth: number,
    public alphabet: AlphabetName,
    public samplingQuality: number,
    characterWidthMultiplier: number,
    characterHeightMultiplier: number,
  ) {
    const metadata = getAlphabetMetadata(alphabet);

    this.sampleRectWidth = fontSize * metadata.width;
    this.sampleRectHeight = fontSize * metadata.height;
    this.boxWidth = this.sampleRectWidth * characterWidthMultiplier;
    this.boxHeight = this.sampleRectHeight * characterHeightMultiplier;
    this.difference = (metadata.width * characterWidthMultiplier - this.characterWidth) / 2;
    this.sampleRectXOff = (this.boxWidth - this.sampleRectWidth) / 2;
    this.sampleRectYOff = (this.boxHeight - this.sampleRectHeight) / 2;

    this.samplePointRadius = fontSize * metadata.samplingConfig.circleRadius;

    this.cols = Math.ceil(canvasWidth / this.boxWidth);
    this.rows = Math.ceil(canvasHeight / this.boxHeight);
    if (this.cols % 2 === 0) this.cols += 1;
    if (this.rows % 2 === 0) this.rows += 1;

    const centerColX = (this.cols / 2) * this.boxWidth;
    const centerRowY = (this.rows / 2) * this.boxHeight;

    this.offsetX = this.canvasWidth / 2 - centerColX;
    this.offsetY = this.canvasHeight / 2 - centerRowY;

    this.letterSpacingEm = metadata.width * characterWidthMultiplier - this.characterWidth;
    this.lineHeight = metadata.height * characterHeightMultiplier;
  }

  public sampleRectPosition(col: number, row: number): [x: number, y: number] {
    const x =
      col * this.boxWidth - this.difference * this.fontSize + this.offsetX + this.sampleRectXOff;
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
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < quality; i++) {
    const angle = (i / quality) * 2 * Math.PI;

    const x = Math.cos(angle);
    const y = Math.sin(angle);

    points.push({ x, y });
  }
  return points;
}
