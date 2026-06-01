import { NextRequest, NextResponse } from "next/server";
import {
  COOKIES,
  TEMP_COOKIE_OPTS,
  getServerConfig,
  originFromHeaders,
  pkceChallenge,
  randomString,
  sanitizeReturnTo,
} from "@/services/zitadel.server";

// Starts the OIDC Authorization Code + PKCE flow: stores the verifier/state in
// short-lived httpOnly cookies and redirects to ZITADEL's hosted login.
export async function GET(request: NextRequest) {
  const cfg = getServerConfig(originFromHeaders(request.headers));
  if (!cfg.clientId) {
    return NextResponse.json(
      { error: "ZITADEL_CLIENT_ID is not configured" },
      { status: 500 }
    );
  }

  const returnTo = sanitizeReturnTo(
    new URL(request.url).searchParams.get("returnTo")
  );

  const verifier = randomString(32);
  const challenge = await pkceChallenge(verifier);
  const state = randomString(16);

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: cfg.scope,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  const res = NextResponse.redirect(
    `${cfg.authorizeEndpoint}?${params.toString()}`
  );
  res.cookies.set(COOKIES.pkceVerifier, verifier, TEMP_COOKIE_OPTS);
  res.cookies.set(COOKIES.state, state, TEMP_COOKIE_OPTS);
  res.cookies.set(COOKIES.returnTo, returnTo, TEMP_COOKIE_OPTS);
  return res;
}
