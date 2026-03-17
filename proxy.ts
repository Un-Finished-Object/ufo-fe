import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/my", "/scraps", "/chats", "/events"];
const REFRESH_TOKEN_COOKIE = "refresh_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const hasToken = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (!hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    loginUrl.searchParams.set("toast", "auth_required");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|fonts/|images/|icons/).*)",
  ],
};
