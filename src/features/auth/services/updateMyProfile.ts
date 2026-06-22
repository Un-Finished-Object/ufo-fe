import { buildApiUrl } from "@/lib/api/client";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";

type UpdateMyProfileResponse = {
  data?: {
    nickname?: string;
  };
  error?: unknown;
};

export async function updateMyProfile({ nickname }: { nickname: string }) {
  // Assumption: profile updates are handled by PATCH /v1/users/me.
  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/users/me"),
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ nickname }),
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error("Failed to update profile.");
  }

  if (response.status === 204) {
    return { nickname };
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return { nickname };
  }

  const payload = JSON.parse(responseText) as UpdateMyProfileResponse;

  if (payload.error) {
    throw new Error("Failed to update profile.");
  }

  return {
    nickname: typeof payload.data?.nickname === "string" ? payload.data.nickname : nickname,
  };
}
