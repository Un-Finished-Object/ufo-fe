import { accountHandlers } from "@/mocks/handlers/accountHandlers";
import { adminChatHandlers } from "@/mocks/handlers/adminChatHandlers";
import { authHandlers } from "@/mocks/handlers/authHandlers";
import { imageHandlers } from "@/mocks/handlers/imageHandlers";
import { patternHandlers } from "@/mocks/handlers/patternHandlers";
import { scenarioHandlers } from "@/mocks/scenarios";

export const handlers = [
  ...scenarioHandlers,
  ...adminChatHandlers,
  ...authHandlers,
  ...patternHandlers,
  ...accountHandlers,
  ...imageHandlers,
];
