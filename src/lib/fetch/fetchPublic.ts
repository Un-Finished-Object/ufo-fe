import { request, type ApiFetchParams } from "@/lib/fetch/request";

export function fetchPublic(params: ApiFetchParams) {
  return request({ ...params, authMode: "public" });
}
