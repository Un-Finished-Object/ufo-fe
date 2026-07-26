import { http } from "msw";
import { apiError, apiSuccess, requireMockAuth } from "@/mocks/utils/response";

const MOCK_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MOCK_MAX_IMAGE_COUNT = 5;
const MOCK_ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const mockAllowedContentTypes = new Set<string>(MOCK_ALLOWED_CONTENT_TYPES);

type MockIssuedUpload = {
  contentLength: number;
  contentType: string;
  uploadFields: Record<string, string>;
};

const mockIssuedUploads = new Map<string, MockIssuedUpload>();
let mockUploadSequence = 0;

export const imageHandlers = [
  http.post("/v1/images/presigned-urls", async ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");

    const body = await request.json() as {
      fileCount?: number;
      purpose?: string;
      files?: Array<{ contentType?: string; contentLength?: number }>;
    };
    const files = Array.isArray(body.files) ? body.files : [];
    const hasInvalidRequest =
      !Number.isInteger(body.fileCount) ||
      typeof body.fileCount !== "number" ||
      body.fileCount < 1 ||
      body.fileCount > MOCK_MAX_IMAGE_COUNT ||
      body.fileCount !== files.length ||
      body.purpose !== "PROFILE" ||
      files.some(
        (file) =>
          typeof file.contentType !== "string" ||
          !mockAllowedContentTypes.has(file.contentType) ||
          typeof file.contentLength !== "number" ||
          !Number.isInteger(file.contentLength) ||
          file.contentLength < 1 ||
          file.contentLength > MOCK_MAX_IMAGE_BYTES,
      );

    if (hasInvalidRequest) {
      return apiError(400, "Invalid image upload request");
    }

    return apiSuccess({
      expiresAt: "2099-01-01T00:00:00Z",
      maxBytes: MOCK_MAX_IMAGE_BYTES,
      allowedContentTypes: MOCK_ALLOWED_CONTENT_TYPES,
      urls: files.map((file) => {
        const imageId = `image-${++mockUploadSequence}`;
        const imageKey = `profiles/1/${imageId}`;
        const contentType = file.contentType as string;
        const contentLength = file.contentLength as number;
        const uploadFields = {
          key: imageKey,
          "Content-Type": contentType,
          "x-amz-tagging": "ufo-upload-status=issued",
          "x-amz-algorithm": "AWS4-HMAC-SHA256",
          "x-amz-credential": "MOCK/20990101/ap-northeast-2/s3/aws4_request",
          "x-amz-date": "20990101T000000Z",
          policy: `mock-policy-${imageId}`,
          "x-amz-signature": `mock-signature-${imageId}`,
        };

        mockIssuedUploads.set(imageId, {
          contentLength,
          contentType,
          uploadFields,
        });

        return {
          presignedUrl: `https://mock-upload.ufo.test/${imageId}`,
          imageKey,
          imageUrl: "/mock/pattern-card.svg",
          uploadFields,
        };
      }),
    });
  }),
  http.post("https://mock-upload.ufo.test/:imageId", async ({ params, request }) => {
    const imageId = String(params.imageId);
    const issuedUpload = mockIssuedUploads.get(imageId);

    if (!issuedUpload) {
      return new Response(null, { status: 400 });
    }

    try {
      const formData = await request.formData();
      const entries = Array.from(formData.entries());
      const fileEntry = entries.at(-1);
      const file = formData.get("file");
      const hasValidFields = Object.entries(issuedUpload.uploadFields).every(
        ([fieldName, fieldValue]) => formData.get(fieldName) === fieldValue,
      );
      const hasValidFile =
        fileEntry?.[0] === "file" &&
        typeof file !== "string" &&
        file !== null &&
        file.type === issuedUpload.contentType &&
        file.size === issuedUpload.contentLength &&
        file.size <= MOCK_MAX_IMAGE_BYTES;

      return new Response(null, {
        status: hasValidFields && hasValidFile ? 204 : 400,
      });
    } catch {
      return new Response(null, { status: 400 });
    }
  }),
];
