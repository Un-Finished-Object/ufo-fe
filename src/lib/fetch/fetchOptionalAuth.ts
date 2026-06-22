import { request, type ApiFetchParams } from "@/lib/fetch/request";

export function fetchOptionalAuth(params: ApiFetchParams) {
  return request({ ...params, authMode: "optional" });
}
