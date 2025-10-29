interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetector {
  detect: (image: ImageBitmapSource) => Promise<DetectedBarcode[]>;
}
interface Window {
  BarcodeDetector?: {
    new (options?: { formats?: string[] }): BarcodeDetector;
  };
}
