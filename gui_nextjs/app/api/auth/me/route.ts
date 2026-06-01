import { NextRequest, NextResponse } from "next/server";
import {
  COOKIES,
  Claims,
  RequestOrigin,
  applySession,
  decodeJwt,
  fetchUserInfo,
  originFromHeaders,
  refreshAccessToken,
} from "@/services/zitadel.server";

// Resolve display claims: prefer the authoritative userinfo endpoint
// (ZITADEL omits profile claims from the id_token by default), and fall back
// to decoding the id_token if userinfo is unavailable.
async function resolveUser(
  accessToken: string,
  idToken: string | undefined,
  origin: RequestOrigin
): Promise<Claims | null> {
  const info = await fetchUserInfo(accessToken, origin);
  if (info) return info;
  return idToken ? decodeJwt(idToken) : null;
}

// Returns the current user's claims, or { user: null }.
// Transparently refreshes the access token when it has expired.
export async function GET(request: NextRequest) {
  const origin = originFromHeaders(request.headers);
  const accessToken = request.cookies.get(COOKIES.accessToken)?.value;
  const idToken = request.cookies.get(COOKIES.idToken)?.value;
  const expiresAt = Number(request.cookies.get(COOKIES.expiresAt)?.value ?? 0);
  const refreshToken = request.cookies.get(COOKIES.refreshToken)?.value;

  const expired = !expiresAt || Date.now() >= expiresAt - 30_000;

  if (accessToken && !expired) {
    return NextResponse.json({
      user: await resolveUser(accessToken, idToken, origin),
    });
  }

  // Access token missing/expired — try to refresh.
  if (refreshToken) {
    const tokens = await refreshAccessToken(refreshToken, origin);
    if (tokens) {
      // ZITADEL may omit a new refresh/id token; keep the existing ones.
      if (!tokens.refresh_token) tokens.refresh_token = refreshToken;
      if (!tokens.id_token) tokens.id_token = idToken;
      const res = NextResponse.json({
        user: await resolveUser(tokens.access_token, tokens.id_token, origin),
      });
      applySession(res, tokens);
      return res;
    }
  }

  return NextResponse.json({ user: null });
}
