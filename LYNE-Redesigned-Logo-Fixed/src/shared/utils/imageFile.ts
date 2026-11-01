const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_STORED_IMAGE_CHARS = 1_700_000;

export async function imageFileToDataUrl(
  file: File,
  maxDimension = 768,
): Promise<string> {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml"
  ) {
    throw new Error("Choose a raster image.");
  }
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("Image is larger than 15 MB.");
  }
  if (typeof createImageBitmap !== "function") {
    throw new Error("Image decoding is unavailable.");
  }

  const bitmap = await createImageBitmap(file);
  try {
    if (!bitmap.width || !bitmap.height) {
      throw new Error("Image has invalid dimensions.");
    }

    const scale = Math.min(
      1,
      maxDimension / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is unavailable.");

    context.drawImage(bitmap, 0, 0, width, height);
    let dataUrl = canvas.toDataURL("image/webp", 0.84);

    if (dataUrl.length > 1_300_000) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.78);
    }
    if (dataUrl.length > MAX_STORED_IMAGE_CHARS) {
      throw new Error("Processed image is too large to store locally.");
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}
