import type { Area } from "react-easy-crop";

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): ImageValidationResult => {
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 2 * 1024 * 1024;

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Formato inválido. Use JPEG, PNG ou WEBP.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Arquivo muito grande. Máximo: 2MB.",
    };
  }

  return { valid: true };
};

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export const getCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível criar contexto do canvas");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Erro ao criar blob da imagem"));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      0.9
    );
  });
};

export const compressImage = async (
  file: File,
  maxWidth = 512,
  maxHeight = 512
): Promise<Blob> => {
  const image = await createImage(URL.createObjectURL(file));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível criar contexto do canvas");
  }

  let { width, height } = image;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width *= ratio;
    height *= ratio;
  }

  canvas.width = width;
  canvas.height = height;

  ctx.drawImage(image, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Erro ao comprimir imagem"));
          return;
        }
        resolve(blob);
      },
      "image/webp",
      0.85
    );
  });
};

export const getImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Erro ao carregar imagem"));
    };

    img.src = url;
  });

