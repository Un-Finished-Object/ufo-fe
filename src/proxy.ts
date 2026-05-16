import { type NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/my", "/scraps", "/chats", "/events"];
const REFRESH_TOKEN_COOKIE = "refresh_token";

function isProtectedPath(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function getFallbackUrl(request: NextRequest) {
  const referer = request.headers.get("referer");

  if (referer) {
    try {
      const refererUrl = new URL(referer);

      if (
        refererUrl.origin === request.nextUrl.origin &&
        !isProtectedPath(refererUrl.pathname) &&
        refererUrl.pathname !== request.nextUrl.pathname
      ) {
        return refererUrl;
      }
    } catch {
      // Ignore malformed referer headers and fall back to the main page.
    }
  }

  return new URL("/", request.url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const hasToken = request.cookies.has(REFRESH_TOKEN_COOKIE);

  if (!hasToken) {
    return NextResponse.redirect(getFallbackUrl(request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|fonts/|images/|icons/).*)",
  ],
};
