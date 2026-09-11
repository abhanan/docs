'use client';
import imageCompression from 'browser-image-compression';

/**
 * Client-side image compression/resize BEFORE upload (M2). Keeps R2 storage and
 * load times down. Returns a compressed File; falls back to the original if
 * compression fails for any reason.
 */
export async function compressImage(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: file.type === 'image/png' ? 'image/png' : 'image/jpeg',
      initialQuality: 0.8,
    });
    // browser-image-compression may return a Blob at runtime; normalise to File.
    const blob = compressed as Blob;
    if (blob instanceof File) return blob;
    return new File([blob], file.name, { type: blob.type || file.type });
  } catch {
    return file;
  }
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // reject absurdly large source files
