/**
 * Utility to compress images in browser before upload
 */
export async function compressImage(file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.82): Promise<File> {
  // If not an image or running on server, return original file
  if (typeof window === 'undefined' || !file.type.startsWith('image/')) {
    return file;
  }

  // GIF images or SVGs might be animated/vector, return original
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // If compressed file is larger than original, keep original
            if (blob.size >= file.size) {
              resolve(file);
              return;
            }
            const ext = file.type === 'image/png' ? 'png' : 'webp';
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + `.${ext}`, {
              type: blob.type || (ext === 'webp' ? 'image/webp' : file.type),
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/**
 * Convert file to base64 data URL
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
