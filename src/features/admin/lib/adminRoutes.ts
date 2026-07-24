function readAdminRouteSegment(name: string, value: string | undefined) {
  const segment = value?.trim();

  if (!segment) {
    throw new Error(`${name} must be configured.`);
  }

  if (segment.includes("/") || segment === "." || segment === "..") {
    throw new Error(`${name} must be a single URL path segment.`);
  }

  return segment;
}

export const adminRouteSegments = {
  main: readAdminRouteSegment(
    "NEXT_PUBLIC_ADMIN_MAIN_PATH",
    process.env.NEXT_PUBLIC_ADMIN_MAIN_PATH,
  ),
  chat: readAdminRouteSegment(
    "NEXT_PUBLIC_ADMIN_CHAT_PATH",
    process.env.NEXT_PUBLIC_ADMIN_CHAT_PATH,
  ),
  comment: readAdminRouteSegment(
    "NEXT_PUBLIC_ADMIN_COMMENT_PATH",
    process.env.NEXT_PUBLIC_ADMIN_COMMENT_PATH,
  ),
} as const;

const uniqueSegments = new Set(Object.values(adminRouteSegments));

if (uniqueSegments.size !== Object.keys(adminRouteSegments).length) {
  throw new Error("Admin route path values must be unique.");
}

export const adminRoutes = {
  main: `/admin/${adminRouteSegments.main}`,
  chat: `/admin/${adminRouteSegments.chat}`,
  comment: `/admin/${adminRouteSegments.comment}`,
} as const;

export function getAdminChatHistoryRoute(chatId: number) {
  return `${adminRoutes.chat}/${chatId}`;
}
