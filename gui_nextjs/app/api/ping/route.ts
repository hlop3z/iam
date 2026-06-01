import { NextRequest, NextResponse } from "next/server";
import {
  COOKIES,
  applySession,
  originFromHeaders,
  refreshAccessToken,
} from "@/services/zitadel.server";

// Base URL of the FastAPI backend. The BFF calls it server-to-server, attaching
// the user's ZITADEL access token (kept in an httpOnly cookie) as a Bearer.
const API_BASE_URL = (
  process.env.API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

async function callPing(accessToken: string, message: string): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/ping`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
    cache: "no-store",
  });
}

// Authenticated ping/pong proxy. Reads the session's access token, forwards the
// message to the FastAPI backend, and relays the response. If the token has
// expired it refreshes once and retries, persisting the new tokens.
export async function POST(request: NextRequest) {
  const origin = originFromHeaders(request.headers);
  const accessToken = request.cookies.get(COOKIES.accessToken)?.value;
  const refreshToken = request.cookies.get(COOKIES.refreshToken)?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { message?: unknown };
  const message = typeof body.message === "string" ? body.message : "";

  let upstream = await callPing(accessToken, message);

  // Token rejected by the API — refresh once and retry.
  if (upstream.status === 401 && refreshToken) {
    const tokens = await refreshAccessToken(refreshToken, origin);
    if (tokens) {
      if (!tokens.refresh_token) tokens.refresh_token = refreshToken;
      upstream = await callPing(tokens.access_token, message);
      const payload = await upstream.json().catch(() => ({}));
      const res = NextResponse.json(payload, { status: upstream.status });
      applySession(res, tokens);
      return res;
    }
  }

  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
