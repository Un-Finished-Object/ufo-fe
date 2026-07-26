import { buildApiUrl } from "@/lib/api/client";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

export async function requestLogout() {
  await fetchAuthenticated({
    input: buildApiUrl("/v1/auth/logout"),
    init: {
      method: "POST",
    },
  });
}
