// Utility functions for client-side image manipulation
import { WatermarkSettings } from '../types';

export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};

export const resizeImage = async (
  src: string,
  width: number,
  height: number,
  format: string = 'image/png'
): Promise<string> => {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  
  // High quality resizing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  // If format is jpeg/bmp, fill background white
  if (format === 'image/jpeg' || format === 'image/bmp') {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  return canvas.toDataURL(format);
};

export const rotateImage = async (src: string, degrees: number): Promise<string> => {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  const radians = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  // Calculate new canvas dimensions
  canvas.width = img.width * cos + img.height * sin;
  canvas.height = img.width * sin + img.height * cos;

  // Translate to center and rotate
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);

  return canvas.toDataURL('image/png');
};

export const flipImage = async (src: string, horizontal: boolean, vertical: boolean): Promise<string> => {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.translate(horizontal ? img.width : 0, vertical ? img.height : 0);
  ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1);
  ctx.drawImage(img, 0, 0);

  return canvas.toDataURL('image/png');
};

export const cropImage = async (
  src: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<string> => {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
  return canvas.toDataURL('image/png');
};

export const compressImage = async (
  src: string,
  targetSizeKB: number,
  format: string
): Promise<{ url: string; size: number }> => {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');
  
  if (format === 'image/jpeg' || format === 'image/bmp') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  ctx.drawImage(img, 0, 0);

  const getSize = (url: string) => Math.round((url.length - (url.indexOf(',') + 1)) * 3 / 4 / 1024);
  
  if (format === 'image/png') {
    const res = canvas.toDataURL(format);
    return { url: res, size: getSize(res) };
  }

  let minQ = 0.01;
  let maxQ = 1.0;
  let quality = 0.92;
  
  let bestUrl = canvas.toDataURL(format, quality);
  let bestSize = getSize(bestUrl);
  let bestDiff = Math.abs(bestSize - targetSizeKB);

  const maxUrl = canvas.toDataURL(format, 1.0);
  if (getSize(maxUrl) <= targetSizeKB) {
      return { url: maxUrl, size: getSize(maxUrl) };
  }

  for (let i = 0; i < 10; i++) {
    quality = (minQ + maxQ) / 2;
    const resultUrl = canvas.toDataURL(format, quality);
    const currentSize = getSize(resultUrl);
    
    const diff = Math.abs(currentSize - targetSizeKB);
    if (diff < bestDiff) {
        bestDiff = diff;
        bestUrl = resultUrl;
        bestSize = currentSize;
    }

    if (Math.abs(currentSize - targetSizeKB) < targetSizeKB * 0.05) {
      return { url: resultUrl, size: currentSize };
    }

    if (currentSize > targetSizeKB) {
      maxQ = quality;
    } else {
      minQ = quality;
    }
  }

  return { url: bestUrl, size: bestSize };
};

export const convertImage = async (src: string, format: string): Promise<string> => {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  if (format === 'image/jpeg' || format === 'image/bmp') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL(format);
};

export const watermarkImage = async (src: string, settings: WatermarkSettings): Promise<string> => {
  const img = await loadImage(src);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(img, 0, 0);
  
  // Configure Font
  // settings.fontSize is a multiplier (e.g. 0.05 for 5% of largest dimension)
  const baseDim = Math.max(img.width, img.height);
  const fontSizePx = baseDim * settings.fontSize;
  
  ctx.font = `bold ${fontSizePx}px sans-serif`;
  ctx.fillStyle = settings.color;
  ctx.globalAlpha = settings.opacity;
  
  // Smart Positioning
  // If x is close to 0, align left. If close to 1, align right. Else center.
  let textAlign: CanvasTextAlign = 'center';
  if (settings.x <= 0.05) textAlign = 'left';
  else if (settings.x >= 0.95) textAlign = 'right';
  
  // If y is close to 0, align top. If close to 1, align bottom. Else middle.
  let textBaseline: CanvasTextBaseline = 'middle';
  if (settings.y <= 0.05) textBaseline = 'top';
  else if (settings.y >= 0.95) textBaseline = 'bottom';

  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;
  
  // Calculate Position
  const xPos = img.width * settings.x;
  const yPos = img.height * settings.y;
  
  // Add padding for edges
  const padding = baseDim * 0.02;
  let finalX = xPos;
  let finalY = yPos;
  
  if (textAlign === 'left') finalX += padding;
  if (textAlign === 'right') finalX -= padding;
  if (textBaseline === 'top') finalY += padding;
  if (textBaseline === 'bottom') finalY -= padding;
  
  ctx.fillText(settings.text, finalX, finalY);
  
  return canvas.toDataURL('image/png');
};