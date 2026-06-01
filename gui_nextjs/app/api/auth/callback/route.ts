import { NextRequest, NextResponse } from "next/server";
import {
  COOKIES,
  applySession,
  exchangeCode,
  getServerConfig,
  originFromHeaders,
  sanitizeReturnTo,
} from "@/services/zitadel.server";

// OIDC redirect target. Validates state, exchanges the code for tokens
// server-side, and stores them in httpOnly cookies — then sends the user on.
export async function GET(request: NextRequest) {
  const cfg = getServerConfig(originFromHeaders(request.headers));
  const url = new URL(request.url);

  const error = url.searchParams.get("error");
  if (error) {
    const desc = url.searchParams.get("error_description") ?? error;
    return NextResponse.redirect(
      `${cfg.appBaseUrl}/auth/error?error=${encodeURIComponent(desc)}`
    );
  }

  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  const expectedState = request.cookies.get(COOKIES.state)?.value;
  const verifier = request.cookies.get(COOKIES.pkceVerifier)?.value;

  if (
    !code ||
    !returnedState ||
    !expectedState ||
    returnedState !== expectedState ||
    !verifier
  ) {
    return NextResponse.redirect(
      `${cfg.appBaseUrl}/auth/error?error=${encodeURIComponent("invalid_state")}`
    );
  }

  try {
    const tokens = await exchangeCode(
      code,
      verifier,
      originFromHeaders(request.headers)
    );
    const returnTo = sanitizeReturnTo(
      request.cookies.get(COOKIES.returnTo)?.value
    );
    const res = NextResponse.redirect(`${cfg.appBaseUrl}${returnTo}`);
    applySession(res, tokens);
    // One-time values — drop them.
    res.cookies.delete(COOKIES.pkceVerifier);
    res.cookies.delete(COOKIES.state);
    res.cookies.delete(COOKIES.returnTo);
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "token_exchange_failed";
    return NextResponse.redirect(
      `${cfg.appBaseUrl}/auth/error?error=${encodeURIComponent(message)}`
    );
  }
}
