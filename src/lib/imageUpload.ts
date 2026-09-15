// Shared image upload rules for FitExtremes.
// 20 MB maximum per individual image, enforced everywhere.

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB per image
export const MAX_IMAGE_SIZE_LABEL = "20 MB";
export const IMAGE_TOO_LARGE_MESSAGE =
  "Image is too large. Maximum file size is 20 MB per image.";

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/** Returns an error message, or null when the file is acceptable. */
export const validateImageFile = (
  file: File,
  opts: { restrictTypes?: boolean } = {},
): string | null => {
  const { restrictTypes = false } = opts;
  if (restrictTypes) {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Only JPG, JPEG, PNG, and WEBP images are allowed";
    }
  } else if (file.type && !file.type.startsWith("image/")) {
    return "Please select an image file";
  }
  if (file.size > MAX_IMAGE_BYTES) return IMAGE_TOO_LARGE_MESSAGE;
  return null;
};

const COMPRESS_THRESHOLD = 1.5 * 1024 * 1024; // only touch larger files
const MAX_DIMENSION = 2000;

/**
 * Downscales/re-encodes large images for faster loading.
 * Always resolves — returns the original file if compression isn't possible
 * or wouldn't reduce the size.
 */
export const compressImage = async (file: File): Promise<File> => {
  try {
    if (typeof document === "undefined") return file;
    if (!file.type.startsWith("image/")) return file;
    if (file.type === "image/gif") return file;
    if (file.size <= COMPRESS_THRESHOLD) return file;

    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
};

/** Validate then compress. Throws with a user-facing message when invalid. */
export const prepareImageForUpload = async (
  file: File,
  opts: { restrictTypes?: boolean } = {},
): Promise<File> => {
  const error = validateImageFile(file, opts);
  if (error) throw new Error(error);
  return compressImage(file);
};
