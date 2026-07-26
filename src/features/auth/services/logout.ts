import { buildApiUrl } from "@/lib/api/client";
import { clearAccessToken, getAccessToken } from "@/lib/auth/accessToken";

export async function requestLogout() {
  const headers = new Headers();
  const accessToken = getAccessToken();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const logoutRequest = fetch(buildApiUrl("/v1/auth/logout"), {
    method: "POST",
    credentials: "include",
    headers,
  });

  clearAccessToken();
  await logoutRequest;
}
