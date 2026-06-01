import { NextRequest, NextResponse } from "next/server";

// Name of the access-token session cookie set by the BFF.
// Mirrors COOKIES.accessToken in services/zitadel.server.ts — kept as a literal
// here so the Edge proxy bundle doesn't pull in the server module.
const SESSION_COOKIE = "iam_at";

/**
 * Gate the whole app behind authentication: any request without a session is
 * redirected to the login route (→ ZITADEL), carrying the originally requested
 * path so the user lands back there after signing in.
 *
 * (Next 16 renamed the "middleware" convention to "proxy".)
 *
 * The `matcher` below excludes the auth API, the auth error page, Next
 * internals, and static files, so this only runs for real page navigations —
 * and never gates /auth/error, which keeps a failed sign-in from looping.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/api/auth/login", request.url);
  loginUrl.searchParams.set(
    "returnTo",
    request.nextUrl.pathname + request.nextUrl.search
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api/auth|api/ping|auth/error|_next/static|_next/image|.*\\.).*)"],
};
