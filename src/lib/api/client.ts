function normalizeApiPath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function buildApiUrl(path: string) {
  return normalizeApiPath(path);
}
