declare module "jsqr" {
  export interface Point {
    x: number;
    y: number;
  }

  export interface QRCode {
    binaryData: Uint8ClampedArray;
    data: string;
    chunks: any[];
    location: {
      topLeftCorner: Point;
      topRightCorner: Point;
      bottomLeftCorner: Point;
      bottomRightCorner: Point;
    };
  }

  export interface QRScanOptions {
    inversionAttempts?: "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst";
  }

  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: QRScanOptions
  ): QRCode | null;
}
