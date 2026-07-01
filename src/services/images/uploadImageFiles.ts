import { buildApiUrl } from "@/lib/api/client";
import {
  createInvalidApiResponseError,
  throwApiError,
  throwApiPayloadError,
} from "@/lib/api/ApiError";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

export const IMAGE_UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp";
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_COUNT = 5;

type ImageUploadPurpose = "PATTERN" | "STYLE" | "PROFILE";

type PresignedImageUpload = {
  presignedUrl: string;
  imageUrl: string;
};

type PresignedImageResponse = {
  data?: {
    expiresAt?: string;
    maxBytes?: number;
    allowedContentTypes?: string[];
    urls?: PresignedImageUpload[];
  };
  error?: unknown;
};

function validatePresignedResponse(payload: PresignedImageResponse, files: File[]) {
  if (!payload.data || !Array.isArray(payload.data.urls)) {
    throw createInvalidApiResponseError("Failed to create image upload URLs.");
  }

  const allowedContentTypes = new Set(payload.data.allowedContentTypes ?? []);
  const maxBytes = payload.data.maxBytes;

  files.forEach((file) => {
    if (allowedContentTypes.size > 0 && !allowedContentTypes.has(file.type)) {
      throw new Error("JPG, PNG, WEBP 이미지만 업로드할 수 있어요.");
    }

    if (typeof maxBytes === "number" && file.size > maxBytes) {
      throw new Error("이미지는 10MB 이하로 업로드해 주세요.");
    }
  });

  payload.data.urls.forEach((url) => {
    if (!url.presignedUrl?.trim() || !url.imageUrl?.trim()) {
      throw createInvalidApiResponseError("Failed to create image upload URLs.");
    }
  });

  return payload.data.urls;
}

function validateImageFiles(files: File[]) {
  if (files.length === 0 || files.length > MAX_IMAGE_COUNT) {
    throw new Error("이미지는 최대 5개까지 업로드할 수 있어요.");
  }

  files.forEach((file) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error("JPG, PNG, WEBP 이미지만 업로드할 수 있어요.");
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("이미지는 10MB 이하로 업로드해 주세요.");
    }
  });
}

async function requestPresignedImageUrls({
  files,
  purpose,
}: {
  files: File[];
  purpose: ImageUploadPurpose;
}) {
  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/images/presigned-urls"),
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileCount: files.length,
        purpose,
        files: files.map((file) => ({
          contentType: file.type,
          contentLength: file.size,
        })),
      }),
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to create image upload URLs.");
  }

  const payload = (await response.json()) as PresignedImageResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to create image upload URLs.");
  }

  return validatePresignedResponse(payload, files);
}

export async function uploadImageFiles({
  files,
  purpose,
}: {
  files: File[];
  purpose: ImageUploadPurpose;
}) {
  validateImageFiles(files);

  const uploads = await requestPresignedImageUrls({ files, purpose });

  if (uploads.length !== files.length) {
    throw createInvalidApiResponseError("Failed to create image upload URLs.");
  }

  await Promise.all(
    files.map(async (file, index) => {
      const upload = uploads[index];
      const response = await fetch(upload.presignedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error("이미지 업로드에 실패했어요.");
      }
    }),
  );

  return uploads.map((upload) => upload.imageUrl);
}
