import { http } from "msw";
import { apiError, apiSuccess, requireMockAuth } from "@/mocks/utils/response";

export const imageHandlers = [
  http.post("/v1/images/presigned-urls", async ({ request }) => {
    if (!requireMockAuth(request)) return apiError(401, "Unauthorized");
    const body = await request.json() as { fileCount?: number };
    const fileCount = Math.max(0, body.fileCount ?? 0);
    return apiSuccess({
      expiresAt: "2099-01-01T00:00:00Z",
      maxBytes: 10 * 1024 * 1024,
      allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
      urls: Array.from({ length: fileCount }, (_, index) => ({
        presignedUrl: `https://mock-upload.ufo.test/image-${index + 1}`,
        imageKey: `mock/image-${index + 1}`,
        imageUrl: "/mock/pattern-card.svg",
      })),
    });
  }),
  http.put("https://mock-upload.ufo.test/:imageId", () => new Response(null, { status: 200 })),
];
