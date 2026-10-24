/**
 * Helper kompresi gambar untuk Feed Post & Story Tamvesta
 * Mengompres foto kamera ponsel berukuran 3MB-10MB menjadi ~60-120KB
 * agar tidak melebihi kuota localStorage 5MB dan payload request Vercel.
 */
export async function compressImage(
  fileOrDataUrl: File | string,
  maxDimension = 1000,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
      }
    };
    img.onerror = () => {
      resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}
