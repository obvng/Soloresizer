export enum ToolType {
  UPLOAD = 'UPLOAD',
  CROP = 'CROP',
  RESIZE = 'RESIZE',
  FLIP = 'FLIP',
  ROTATE = 'ROTATE',
  COMPRESS = 'COMPRESS',
  CONVERT = 'CONVERT',
  WATERMARK = 'WATERMARK',
  AI_DESCRIBE = 'AI_DESCRIBE'
}

export enum AppMode {
  EDITOR = 'EDITOR',
  BULK = 'BULK',
  TEXT = 'TEXT'
}

export interface ImageState {
  originalFile: File | null;
  currentPreviewUrl: string | null;
  width: number;
  height: number;
  size: number;
  type: string;
  name: string;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WatermarkSettings {
  text: string;
  color: string;
  opacity: number;
  x: number; // 0-1 ratio of image width
  y: number; // 0-1 ratio of image height
  fontSize: number; // Scale factor relative to image size (e.g. 0.05 for 5%)
}