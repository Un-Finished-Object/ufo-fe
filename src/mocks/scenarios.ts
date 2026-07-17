import { http } from "msw";
import { apiError } from "@/mocks/utils/response";

export type MockScenario = "default" | "unauthorized" | "server-error";

function getMockScenario(): MockScenario {
  const scenario = process.env.NEXT_PUBLIC_MOCK_SCENARIO ?? "default";
  return scenario === "unauthorized" || scenario === "server-error" ? scenario : "default";
}

export const scenarioHandlers = [
  http.all("/v1/*", () => {
    const scenario = getMockScenario();
    if (scenario === "unauthorized") return apiError(401, "Mock unauthorized response");
    if (scenario === "server-error") return apiError(500, "Mock server error");
  }),
];
