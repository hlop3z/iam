"use client";

/**
 * ZITADEL auth — client side of the BFF (Backend-for-Frontend) flow.
 *
 * Tokens live in httpOnly cookies managed by the server route handlers under
 * /api/auth/*. The browser NEVER sees the tokens; it only:
 *   - navigates to /api/auth/login to sign in,
 *   - navigates to /api/auth/logout to sign out,
 *   - calls /api/auth/me to learn who is signed in.
 *
 * See services/zitadel.server.ts for the server side + required env vars.
 *
 * Usage:
 *   const { user, isAuthenticated, loading, login, logout } = useAuth();
 */

import { useCallback, useEffect, useState } from "react";

export interface UserClaims {
  sub: string;
  name?: string;
  email?: string;
  preferred_username?: string;
  [claim: string]: unknown;
}

/** Redirect to the BFF login route (starts the OIDC flow). */
export function login(): void {
  window.location.assign("/api/auth/login");
}

/** Redirect to the BFF logout route (clears cookies + ends the SSO session). */
export function logout(): void {
  window.location.assign("/api/auth/logout");
}

/** Fetch the current user's claims from the BFF, or null if signed out. */
export async function getUser(): Promise<UserClaims | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { user: UserClaims | null };
    return data.user;
  } catch {
    return null;
  }
}

export interface UseAuth {
  user: UserClaims | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

/** Component hook: resolves the signed-in user and exposes login/logout. */
export function useAuth(): UseAuth {
  const [user, setUser] = useState<UserClaims | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getUser().then((u) => {
      if (active) {
        setUser(u);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const doLogin = useCallback(() => login(), []);
  const doLogout = useCallback(() => logout(), []);

  return {
    user,
    isAuthenticated: !!user,
    loading,
    login: doLogin,
    logout: doLogout,
  };
}
