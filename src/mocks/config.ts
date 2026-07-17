export const API_MODES = ["local", "mock"] as const;
export type ApiMode = (typeof API_MODES)[number];

export function getApiMode(): ApiMode {
  const mode = process.env.NEXT_PUBLIC_API_MODE ?? "local";

  if (mode === "mock" || mode === "local") {
    return mode;
  }

  throw new Error(`Unsupported NEXT_PUBLIC_API_MODE: ${mode}`);
}

export function isMockMode() {
  return getApiMode() === "mock";
}

export function getMockDelay() {
  const delay = Number(process.env.NEXT_PUBLIC_MOCK_DELAY ?? 300);
  return Number.isFinite(delay) && delay >= 0 ? delay : 300;
}
