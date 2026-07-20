const OAUTH_FLOW_SESSION_KEY = "ufo:oauth-flow-started-at";
const OAUTH_FLOW_TTL_MS = 10 * 60 * 1000;

export function markOAuthFlowStarted() {
  window.sessionStorage.setItem(OAUTH_FLOW_SESSION_KEY, String(Date.now()));
}

export function clearOAuthFlow() {
  window.sessionStorage.removeItem(OAUTH_FLOW_SESSION_KEY);
}

export function consumeValidOAuthFlow() {
  const startedAtValue = window.sessionStorage.getItem(OAUTH_FLOW_SESSION_KEY);
  clearOAuthFlow();

  if (!startedAtValue) return false;

  const startedAt = Number(startedAtValue);
  const elapsedTime = Date.now() - startedAt;
  return Number.isFinite(startedAt) && elapsedTime >= 0 && elapsedTime <= OAUTH_FLOW_TTL_MS;
}
