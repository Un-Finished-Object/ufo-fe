import { type NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/lib/metadata";
import { isMockMode } from "@/mocks/config";

const PROTECTED_ROUTES = ["/my", "/scraps", "/chats", "/events"];
const REFRESH_TOKEN_COOKIE = "refresh_token";
const REFRESH_TOKEN_PATH = "/v1/auth/token/refresh";
const PATTERN_DETAIL_PATH = /^\/patterns\/([^/]+)$/;

function isValidPatternId(value: string) {
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value));
}

function buildPublicPatternDetailApiUrl(patternId: number) {
  const apiProxyTarget = process.env.NEXT_API_PROXY_TARGET?.replace(/\/$/, "");
  const baseUrl = apiProxyTarget || siteConfig.url;

  return `${baseUrl}/v1/patterns/${patternId}`;
}

async function patternExists(patternId: number) {
  if (isMockMode()) {
    const { mockPatternDetails } = await import("@/mocks/fixtures/core");

    return Boolean(mockPatternDetails[patternId]);
  }

  try {
    const response = await fetch(buildPublicPatternDetailApiUrl(patternId), {
      method: "GET",
      next: { revalidate: 300 },
    });

    if (response.status === 404) {
      return false;
    }

    return null;
  } catch {
    // Let the route render its normal upstream error when availability is unknown.
    return null;
  }
}

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === REFRESH_TOKEN_PATH &&
    !request.cookies.has(REFRESH_TOKEN_COOKIE)
  ) {
    return new NextResponse(null, { status: 401 });
  }

  const patternDetailMatch = pathname.match(PATTERN_DETAIL_PATH);

  if (patternDetailMatch) {
    let patternIdValue: string;

    try {
      patternIdValue = decodeURIComponent(patternDetailMatch[1]);
    } catch {
      return NextResponse.next({ status: 404 });
    }

    if (!isValidPatternId(patternIdValue)) {
      return NextResponse.next({ status: 404 });
    }

    const exists = await patternExists(Number(patternIdValue));

    if (exists === false) {
      return NextResponse.next({ status: 404 });
    }
  }

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
