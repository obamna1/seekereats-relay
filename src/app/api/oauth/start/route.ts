import { NextRequest, NextResponse } from "next/server";
import { buildAuthorizationUrl, generateState } from "@/lib/square-oauth";

// In-memory state storage (for CSRF protection)
// In production, use Redis or database
const stateStore = new Map<string, { isSandbox: boolean; timestamp: number }>();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isSandbox = searchParams.get("sandbox") === "true";

    // Generate state for CSRF protection
    const state = generateState();
    stateStore.set(state, { isSandbox, timestamp: Date.now() });

    // Clean up old states (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of stateStore.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        stateStore.delete(key);
      }
    }

    // Build redirect URI
    const redirectUri =
      process.env.OAUTH_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/oauth/callback`;

    const authUrl = buildAuthorizationUrl(redirectUri, isSandbox, state);

    return NextResponse.json({
      success: true,
      data: { authUrl, state },
    });
  } catch (error) {
    console.error("OAuth start error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start OAuth",
      },
      { status: 500 },
    );
  }
}

// Export state store for callback route
export { stateStore };
