import { accountHandlers } from "@/mocks/handlers/accountHandlers";
import { authHandlers } from "@/mocks/handlers/authHandlers";
import { imageHandlers } from "@/mocks/handlers/imageHandlers";
import { patternHandlers } from "@/mocks/handlers/patternHandlers";
import { scenarioHandlers } from "@/mocks/scenarios";

export const handlers = [
  ...scenarioHandlers,
  ...authHandlers,
  ...patternHandlers,
  ...accountHandlers,
  ...imageHandlers,
];
