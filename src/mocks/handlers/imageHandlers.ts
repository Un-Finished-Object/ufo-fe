import { http } from "msw";
import { apiError, apiSuccess, requireMockAuth } from "@/mocks/utils/response";

const mockUploadContentTypes = new Map<string, string>();

export const imageHandlers = [
  http.post("/v1/images/presigned-urls", async ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const body = await request.json() as {
      fileCount?: number;
      files?: Array<{ contentType?: string }>;
    };
    const fileCount = Math.max(0, body.fileCount ?? 0);
    return apiSuccess({
      expiresAt: "2099-01-01T00:00:00Z",
      maxBytes: 10 * 1024 * 1024,
      allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
      urls: Array.from({ length: fileCount }, (_, index) => {
        const imageId = `image-${index + 1}`;
        const contentType = body.files?.[index]?.contentType ?? "image/png";
        mockUploadContentTypes.set(imageId, contentType);

        return {
          presignedUrl: `https://mock-upload.ufo.test/${imageId}`,
          imageKey: `mock/${imageId}`,
          imageUrl: "/mock/pattern-card.svg",
          uploadHeaders: {
            "x-amz-tagging": "ufo-upload-status=issued",
            "Content-Type": contentType,
          },
        };
      }),
    });
  }),
  http.put("https://mock-upload.ufo.test/:imageId", ({ params, request }) => {
    const imageId = String(params.imageId);
    const expectedContentType = mockUploadContentTypes.get(imageId);
    const hasValidHeaders =
      expectedContentType !== undefined &&
      request.headers.get("Content-Type") === expectedContentType &&
      request.headers.get("x-amz-tagging") === "ufo-upload-status=issued";

    return new Response(null, { status: hasValidHeaders ? 200 : 400 });
  }),
];
