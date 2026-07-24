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
    "ADMIN_MAIN_PATH",
    process.env.ADMIN_MAIN_PATH,
  ),
  chat: readAdminRouteSegment(
    "ADMIN_CHAT_PATH",
    process.env.ADMIN_CHAT_PATH,
  ),
  comment: readAdminRouteSegment(
    "ADMIN_COMMENT_PATH",
    process.env.ADMIN_COMMENT_PATH,
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
} as const satisfies AdminRoutePaths;
import "server-only";
import type { AdminRoutePaths } from "@/features/admin/types/adminRoutePaths";
