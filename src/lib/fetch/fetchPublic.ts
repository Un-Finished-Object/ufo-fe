import { fetchWithAuthRetry } from "@/lib/fetch/fetchWithAuthRetry";

type FetchPublicParams = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

export function fetchPublic({ input, init }: FetchPublicParams) {
  return fetchWithAuthRetry({
    input,
    init: {
      ...init,
      credentials: init?.credentials ?? "omit",
    },
    skipRefresh: true,
  });
}
