import { NextRequest, NextResponse } from "next/server";
import { consoleURL, originFromHeaders } from "@/services/zitadel.server";

// Redirects to the signed-in user's ZITADEL console profile page. Kept on the
// server so the console URL is derived from the request origin — the client
// navbar just links to this path, with no server-only imports.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(
    consoleURL("/users/me", originFromHeaders(request.headers))
  );
}
