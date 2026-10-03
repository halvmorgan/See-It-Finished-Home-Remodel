/**
 * Utility functions for resizing images, handling file validation,
 * and generating downloadable before-and-after composite cards.
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a JPG, PNG, or WebP image.',
    };
  }

  const maxBytes = 20 * 1024 * 1024; // 20 MB
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: 'File size exceeds 20 MB limit. Please choose a smaller image.',
    };
  }

  return { valid: true };
}

export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes an image preserving aspect ratio to optimize API payload speed
 */
export async function resizeImageForGeneration(
  dataUrl: string,
  options: ResizeOptions = {}
): Promise<{ dataUrl: string; width: number; height: number; mimeType: string }> {
  const { maxWidth = 1536, maxHeight = 1536, quality = 0.92 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = 'image/jpeg';
      const resizedDataUrl = canvas.toDataURL(mimeType, quality);

      resolve({
        dataUrl: resizedDataUrl,
        width,
        height,
        mimeType,
      });
    };

    img.onerror = () => reject(new Error('Failed to process image data'));
    img.src = dataUrl;
  });
}

/**
 * Creates a high-resolution side-by-side comparison image for download
 */
export async function generateComparisonDownloadCard(
  beforeUrl: string,
  afterUrl: string,
  title: string = "See It Finished"
): Promise<string> {
  const loadImg = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not load image for export'));
      img.src = url;
    });
  };

  const [imgBefore, imgAfter] = await Promise.all([loadImg(beforeUrl), loadImg(afterUrl)]);

  const targetHeight = 900;
  const aspectBefore = imgBefore.width / imgBefore.height;
  const aspectAfter = imgAfter.width / imgAfter.height;

  const widthBefore = Math.round(targetHeight * aspectBefore);
  const widthAfter = Math.round(targetHeight * aspectAfter);

  const headerHeight = 90;
  const footerHeight = 50;
  const gap = 12;

  const totalWidth = widthBefore + widthAfter + gap;
  const totalHeight = targetHeight + headerHeight + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = totalWidth;
  canvas.height = totalHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  // Background
  ctx.fillStyle = '#0F172A'; // Navy background
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Header Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(title, 36, 52);

  ctx.fillStyle = '#14B8A6'; // Teal accent
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('BEFORE & AFTER EXTERIOR VISION', 36, 78);

  // Right header note
  ctx.fillStyle = '#94A3B8';
  ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('AI Design Preview · Details May Vary', totalWidth - 36, 62);
  ctx.textAlign = 'left';

  // Draw Before
  const yOffset = headerHeight;
  ctx.drawImage(imgBefore, 0, yOffset, widthBefore, targetHeight);

  // Before Badge
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(16, yOffset + 16, 110, 36);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('ORIGINAL', 32, yOffset + 40);

  // Draw After
  const afterX = widthBefore + gap;
  ctx.drawImage(imgAfter, afterX, yOffset, widthAfter, targetHeight);

  // After Badge
  ctx.fillStyle = 'rgba(13, 148, 136, 0.95)'; // Teal
  ctx.fillRect(afterX + 16, yOffset + 16, 150, 36);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('AI MAKEOVER', afterX + 30, yOffset + 40);

  // Footer
  ctx.fillStyle = '#64748B';
  ctx.font = '13px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('Preserving core structural geometry, roofline, window openings, and surrounding environment.', 36, totalHeight - 20);

  return canvas.toDataURL('image/jpeg', 0.95);
}
