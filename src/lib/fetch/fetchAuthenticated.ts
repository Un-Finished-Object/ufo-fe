import { request, type ApiFetchParams } from "@/lib/fetch/request";

export function fetchAuthenticated(params: ApiFetchParams) {
  return request({ ...params, authMode: "required" });
}
