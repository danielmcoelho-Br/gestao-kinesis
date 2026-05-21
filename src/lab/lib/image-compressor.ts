"use client";

/**
 * Compresses a Base64 image or a File object using the Canvas API.
 * @param input - The base64 string or File to compress.
 * @param maxWidth - The maximum width of the output image.
 * @param quality - The JPEG compression quality (0.0 to 1.0).
 * @returns A promise that resolves to the compressed Base64 string.
 */
export async function compressImage(
  input: string | File,
  maxWidth: number = 1200,
  quality: number = 0.7,
  format: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg'
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImage = (base64: string) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width *= maxWidth / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Use the specified format to preserve transparency (png) or optimize (jpeg)
        resolve(canvas.toDataURL(format, quality));
      };
      img.onerror = () => resolve(base64); // Fallback
    };

    if (input instanceof File) {
      const reader = new FileReader();
      reader.onload = () => processImage(reader.result as string);
      reader.onerror = () => resolve(""); // Fail gracefully
      reader.readAsDataURL(input);
    } else {
      processImage(input);
    }
  });
}
