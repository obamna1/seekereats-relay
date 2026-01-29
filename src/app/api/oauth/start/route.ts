import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizationUrl, generateState } from "@/lib/square-oauth";
import { setOAuthState } from "@/lib/oauth-state-store";

// CORS headers for cross-origin requests from landing page
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isSandbox = searchParams.get("sandbox") === "true";
    const redirectUrl = searchParams.get("redirect_url") || undefined;

    // Generate state for CSRF protection
    const state = generateState();

    // Store state in persistent file storage (survives Railway restarts)
    await setOAuthState(state, {
      isSandbox,
      timestamp: Date.now(),
      redirectUrl,
    });

    // Build redirect URI
    const redirectUri =
      process.env.OAUTH_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/oauth/callback`;

    const authUrl = buildAuthorizationUrl(redirectUri, isSandbox, state);

    return NextResponse.json(
      {
        success: true,
        data: { authUrl, state },
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("OAuth start error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start OAuth",
      },
      { status: 500, headers: corsHeaders },
    );
  }
}
