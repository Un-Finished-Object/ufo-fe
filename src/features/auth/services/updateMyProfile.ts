import { buildApiUrl } from "@/lib/api/client";
import { fetchAuthenticated } from "@/lib/fetch/fetchAuthenticated";
import { throwApiError, throwApiPayloadError } from "@/lib/api/ApiError";

type UpdateMyProfileResponse = {
  data?: {
    userName?: string;
    profileImage?: string;
  };
  error?: unknown;
};

export async function updateMyProfile({
  userName,
  profileImage,
}: {
  userName: string | null;
  profileImage: string | null;
}) {
  const response = await fetchAuthenticated({
    input: buildApiUrl("/v1/users/me"),
    init: {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userName, profileImage }),
    },
  });

  if (!response.ok) {
    await throwApiError(response, "Failed to update profile.");
  }

  if (response.status === 204) {
    return { nickname: userName, profileImage };
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    return { nickname: userName, profileImage };
  }

  const payload = JSON.parse(responseText) as UpdateMyProfileResponse;

  if (payload.error) {
    throwApiPayloadError(payload.error, "Failed to update profile.");
  }

  return {
    nickname: typeof payload.data?.userName === "string" ? payload.data.userName : userName,
    profileImage: typeof payload.data?.profileImage === "string" ? payload.data.profileImage : profileImage,
  };
}
