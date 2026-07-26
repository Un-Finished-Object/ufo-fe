import { buildApiUrl } from "@/lib/api/client";
import {
  beginAccessTokenLogout,
  cancelAccessTokenLogout,
  getAccessTokenSnapshot,
  invalidateAccessTokenSession,
} from "@/lib/auth/accessToken";
import {
  ensureFreshAccessToken,
  type RefreshReason,
} from "@/lib/auth/refreshCoordinator";

function sendLogoutRequest(accessToken: string) {
  return fetch(buildApiUrl("/v1/auth/logout"), {
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function resolveLogoutAccessToken({
  expectedGeneration,
  reason,
}: {
  expectedGeneration: number;
  reason: Extract<RefreshReason, "logout" | "logout-retry">;
}) {
  const refreshResult = await ensureFreshAccessToken({ reason });

  if (
    refreshResult.type === "unauthorized" ||
    getAccessTokenSnapshot().sessionPhase === "inactive"
  ) {
    return null;
  }

  if (refreshResult.type !== "refreshed" && refreshResult.type !== "fresh") {
    throw new Error("Failed to prepare an access token for logout.");
  }

  const snapshot = getAccessTokenSnapshot();

  if (
    snapshot.sessionGeneration !== expectedGeneration ||
    snapshot.sessionPhase !== "logging-out" ||
    !snapshot.token
  ) {
    throw new Error("The authentication session changed during logout.");
  }

  return snapshot.token;
}

export async function requestLogout() {
  const logoutGeneration = beginAccessTokenLogout();

  if (logoutGeneration === null) {
    if (getAccessTokenSnapshot().sessionPhase === "inactive") {
      return;
    }

    throw new Error("Logout is already in progress.");
  }

  try {
    const accessToken = await resolveLogoutAccessToken({
      expectedGeneration: logoutGeneration,
      reason: "logout",
    });

    if (!accessToken) {
      return;
    }

    let response = await sendLogoutRequest(accessToken);

    if (response.status === 401 || response.status === 403) {
      const retryAccessToken = await resolveLogoutAccessToken({
        expectedGeneration: logoutGeneration,
        reason: "logout-retry",
      });

      if (!retryAccessToken) {
        return;
      }

      response = await sendLogoutRequest(retryAccessToken);
    }

    if (!response.ok) {
      throw new Error(`Logout request failed with status ${response.status}.`);
    }

    const didInvalidateSession = invalidateAccessTokenSession({
      expectedGeneration: logoutGeneration,
    });

    if (
      !didInvalidateSession &&
      getAccessTokenSnapshot().sessionPhase !== "inactive"
    ) {
      throw new Error("The authentication session changed during logout.");
    }
  } catch (error) {
    cancelAccessTokenLogout(logoutGeneration);
    throw error;
  }
}
