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

type ImageUploadPurpose = "PROFILE";

type PresignedImageUpload = {
  presignedUrl: string;
  imageKey: string;
  imageUrl: string;
  uploadFields: Record<string, string>;
};

export type UploadedImageFile = {
  imageKey: string;
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

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0 &&
    Object.entries(value).every(
      ([fieldName, fieldValue]) =>
        fieldName.trim().length > 0 &&
        typeof fieldValue === "string" &&
        fieldValue.trim().length > 0,
    )
  );
}

function validatePresignedResponse(payload: PresignedImageResponse, files: File[]) {
  if (
    !payload.data ||
    typeof payload.data.expiresAt !== "string" ||
    Number.isNaN(Date.parse(payload.data.expiresAt)) ||
    typeof payload.data.maxBytes !== "number" ||
    !Number.isFinite(payload.data.maxBytes) ||
    payload.data.maxBytes < 1 ||
    !Array.isArray(payload.data.allowedContentTypes) ||
    payload.data.allowedContentTypes.length === 0 ||
    !payload.data.allowedContentTypes.every(
      (contentType) => typeof contentType === "string" && contentType.trim().length > 0,
    ) ||
    !Array.isArray(payload.data.urls) ||
    payload.data.urls.length !== files.length
  ) {
    throw createInvalidApiResponseError("Failed to create image upload URLs.");
  }

  const allowedContentTypes = new Set(payload.data.allowedContentTypes);
  const maxBytes = payload.data.maxBytes;

  files.forEach((file) => {
    if (!allowedContentTypes.has(file.type)) {
      throw new Error("JPG, PNG, WEBP 이미지만 업로드할 수 있어요.");
    }

    if (file.size > maxBytes) {
      throw new Error("이미지는 10MB 이하로 업로드해 주세요.");
    }
  });

  payload.data.urls.forEach((url, index) => {
    if (
      !url.presignedUrl?.trim() ||
      !url.imageKey?.trim() ||
      !url.imageUrl?.trim() ||
      !isStringRecord(url.uploadFields) ||
      url.uploadFields.key !== url.imageKey ||
      url.uploadFields["Content-Type"] !== files[index]?.type
    ) {
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

    if (file.size < 1) {
      throw new Error("비어 있는 이미지는 업로드할 수 없어요.");
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
      const formData = new FormData();

      Object.entries(upload.uploadFields).forEach(([fieldName, fieldValue]) => {
        formData.append(fieldName, fieldValue);
      });
      formData.append("file", file);

      const response = await fetch(upload.presignedUrl, {
        method: "POST",
        body: formData,
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error("이미지 업로드에 실패했어요.");
      }
    }),
  );

  return uploads.map((upload) => ({
    imageKey: upload.imageKey,
    imageUrl: upload.imageUrl,
  })) satisfies UploadedImageFile[];
}
