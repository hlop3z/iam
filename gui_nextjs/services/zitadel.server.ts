/**
 * ZITADEL server-side helpers for the BFF (Backend-for-Frontend) auth flow.
 *
 * This module runs ONLY on the server (route handlers). Tokens are exchanged
 * here and stored in httpOnly cookies, so they are never exposed to client JS.
 *
 * Server-side env (do NOT prefix with NEXT_PUBLIC — these must stay private):
 *
 *   ZITADEL_ISSUER=http://localhost:8080
 *   ZITADEL_CLIENT_ID=<your app's client id>
 *   ZITADEL_CLIENT_SECRET=<optional; set for a confidential "Web" app>
 *   APP_BASE_URL=http://localhost:3000
 *
 * Register this redirect URI in the ZITADEL console:
 *   http://localhost:3000/api/auth/callback
 * and this post-logout URI:
 *   http://localhost:3000
 */

import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Cookie names + options
// ---------------------------------------------------------------------------

export const COOKIES = {
  accessToken: "iam_at",
  idToken: "iam_it",
  refreshToken: "iam_rt",
  expiresAt: "iam_exp",
  pkceVerifier: "iam_pkce",
  state: "iam_state",
  returnTo: "iam_returnto",
} as const;

const isProd = process.env.NODE_ENV === "production";

/** Short-lived cookies that carry PKCE verifier + state across the redirect. */
export const TEMP_COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 600, // 10 minutes
};

/** Long-lived session cookies holding the tokens. */
export const SESSION_COOKIE_OPTS = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
}

export interface Claims {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  [claim: string]: unknown;
}

// ---------------------------------------------------------------------------
// Config & endpoints
// ---------------------------------------------------------------------------

export interface RequestOrigin {
  host?: string | null;
  proto?: string | null;
}

/** Pull the externally-visible host + scheme from a request's headers. */
export function originFromHeaders(headers: Headers): RequestOrigin {
  return {
    host: headers.get("x-forwarded-host") ?? headers.get("host"),
    proto: headers.get("x-forwarded-proto") ?? "http",
  };
}

/**
 * Resolve config. URLs come from explicit env (prod) when set; otherwise they
 * are derived from the request host (dev), so the LAN IP / localhost don't need
 * to be hard-coded. ZITADEL is assumed to run on the same host as the app, on
 * ZITADEL_PROXY_PORT (default 8080).
 */
export function getServerConfig(origin?: RequestOrigin) {
  const host = origin?.host ?? null;
  const proto = origin?.proto ?? "http";
  const hostname = host ? host.split(":")[0] : null;
  const zitadelPort = process.env.ZITADEL_PROXY_PORT ?? "8080";

  const issuer = (
    process.env.ZITADEL_ISSUER ??
    (hostname ? `${proto}://${hostname}:${zitadelPort}` : "http://localhost:8080")
  ).replace(/\/$/, "");
  const appBaseUrl = (
    process.env.APP_BASE_URL ??
    (host ? `${proto}://${host}` : "http://localhost:3000")
  ).replace(/\/$/, "");

  return {
    issuer,
    appBaseUrl,
    clientId: process.env.ZITADEL_CLIENT_ID ?? "",
    clientSecret: process.env.ZITADEL_CLIENT_SECRET ?? "",
    redirectUri: `${appBaseUrl}/api/auth/callback`,
    postLogoutRedirectUri: appBaseUrl,
    scope: "openid profile email offline_access",
    authorizeEndpoint: `${issuer}/oauth/v2/authorize`,
    tokenEndpoint: `${issuer}/oauth/v2/token`,
    userinfoEndpoint: `${issuer}/oidc/v1/userinfo`,
    endSessionEndpoint: `${issuer}/oidc/v1/end_session`,
  };
}

/** Absolute URL into the ZITADEL console, derived from the request origin. */
export function consoleURL(path = "", origin?: RequestOrigin): string {
  return `${getServerConfig(origin).issuer}/ui/console${path}`;
}


// ---------------------------------------------------------------------------
// PKCE + JWT helpers (Web Crypto, available as a global in the Node runtime)
// ---------------------------------------------------------------------------

function base64Url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier)
  );
  return base64Url(new Uint8Array(digest));
}

/**
 * Validate a post-login return path. Only same-origin absolute paths are
 * allowed (must start with a single "/"); anything else falls back to "/"
 * to prevent open-redirect abuse.
 */
export function sanitizeReturnTo(
  value: string | null | undefined,
  fallback = "/"
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export function decodeJwt(token: string): Claims | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(
      payload.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    return JSON.parse(json) as Claims;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Token endpoint calls
// ---------------------------------------------------------------------------

function tokenRequestInit(
  body: URLSearchParams,
  origin?: RequestOrigin
): RequestInit {
  const cfg = getServerConfig(origin);
  const headers: Record<string, string> = {
    "Content-Type": "application/x-www-form-urlencoded",
  };
  // Confidential client: authenticate with the secret (client_secret_basic).
  if (cfg.clientSecret) {
    const basic = Buffer.from(
      `${cfg.clientId}:${cfg.clientSecret}`
    ).toString("base64");
    headers.Authorization = `Basic ${basic}`;
  }
  return { method: "POST", headers, body };
}

export async function exchangeCode(
  code: string,
  codeVerifier: string,
  origin?: RequestOrigin
): Promise<TokenResponse> {
  const cfg = getServerConfig(origin);
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
    client_id: cfg.clientId,
    code_verifier: codeVerifier,
  });

  const res = await fetch(cfg.tokenEndpoint, tokenRequestInit(body, origin));
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  }
  return (await res.json()) as TokenResponse;
}

/**
 * Fetch the user's profile claims (name, email, preferred_username, …) from
 * ZITADEL's userinfo endpoint. ZITADEL does not include profile claims in the
 * id_token by default, so this is the reliable source for display data.
 */
export async function fetchUserInfo(
  accessToken: string,
  origin?: RequestOrigin
): Promise<Claims | null> {
  const cfg = getServerConfig(origin);
  const res = await fetch(cfg.userinfoEndpoint, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as Claims;
}

export async function refreshAccessToken(
  refreshToken: string,
  origin?: RequestOrigin
): Promise<TokenResponse | null> {
  const cfg = getServerConfig(origin);
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: cfg.clientId,
    scope: cfg.scope,
  });

  const res = await fetch(cfg.tokenEndpoint, tokenRequestInit(body, origin));
  if (!res.ok) return null;
  return (await res.json()) as TokenResponse;
}

// ---------------------------------------------------------------------------
// Session cookie management
// ---------------------------------------------------------------------------

/** Write the token set into httpOnly session cookies on the response. */
export function applySession(res: NextResponse, tokens: TokenResponse): void {
  const expiresIn =
    typeof tokens.expires_in === "number" ? tokens.expires_in : 3600;
  const expiresAt = Date.now() + expiresIn * 1000;

  res.cookies.set(COOKIES.accessToken, tokens.access_token, SESSION_COOKIE_OPTS);
  res.cookies.set(COOKIES.expiresAt, String(expiresAt), SESSION_COOKIE_OPTS);
  if (tokens.id_token) {
    res.cookies.set(COOKIES.idToken, tokens.id_token, SESSION_COOKIE_OPTS);
  }
  if (tokens.refresh_token) {
    res.cookies.set(
      COOKIES.refreshToken,
      tokens.refresh_token,
      SESSION_COOKIE_OPTS
    );
  }
}

/** Remove all session + temp cookies from the response. */
export function clearSession(res: NextResponse): void {
  for (const name of Object.values(COOKIES)) {
    res.cookies.delete(name);
  }
}
