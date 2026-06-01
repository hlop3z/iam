import { NextRequest, NextResponse } from "next/server";
import {
  COOKIES,
  clearSession,
  getServerConfig,
  originFromHeaders,
} from "@/services/zitadel.server";

// Clears the session cookies and redirects to ZITADEL's end-session endpoint
// so the SSO session is terminated, not just the local cookies.
export async function GET(request: NextRequest) {
  const cfg = getServerConfig(originFromHeaders(request.headers));
  const idToken = request.cookies.get(COOKIES.idToken)?.value;

  const params = new URLSearchParams({
    client_id: cfg.clientId,
    post_logout_redirect_uri: cfg.postLogoutRedirectUri,
  });
  if (idToken) params.set("id_token_hint", idToken);

  const res = NextResponse.redirect(
    `${cfg.endSessionEndpoint}?${params.toString()}`
  );
  clearSession(res);
  return res;
}
