import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getMerchantInfo } from "@/lib/square-oauth";
import { storeMerchantTokens } from "@/lib/merchant-store";
import { getAndDeleteOAuthState } from "@/lib/oauth-state-store";

// Helper to get the base URL for redirects
function getBaseUrl(request: NextRequest): string {
  // Prefer OAUTH_REDIRECT_URI for production deployments
  const redirectUri = process.env.OAUTH_REDIRECT_URI;
  if (redirectUri) {
    // Extract base URL from redirect URI (remove /api/oauth/callback)
    return redirectUri.replace(/\/api\/oauth\/callback$/, "");
  }
  // Fallback to request origin (works locally)
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    const baseUrl = getBaseUrl(request);

    // Handle OAuth errors
    if (error) {
      const errorUrl = new URL("/connect", baseUrl);
      errorUrl.searchParams.set("oauth_error", errorDescription || error);
      return NextResponse.redirect(errorUrl.toString());
    }

    if (!code || !state) {
      return NextResponse.json(
        { success: false, error: "Missing code or state parameter" },
        { status: 400 },
      );
    }

    // Verify state (CSRF protection) - uses persistent file storage
    const stateData = await getAndDeleteOAuthState(state);
    if (!stateData) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired state parameter" },
        { status: 400 },
      );
    }

    const isSandbox = stateData.isSandbox;
    const redirectUri =
      process.env.OAUTH_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/oauth/callback`;

    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code, redirectUri, isSandbox);

    // Get merchant info
    const merchantInfo = await getMerchantInfo(
      tokenData.accessToken,
      isSandbox,
    );

    // Store tokens with location ID
    await storeMerchantTokens({
      merchantId: tokenData.merchantId,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt,
      businessName: merchantInfo.businessName,
      locationId: merchantInfo.mainLocationId,
      isSandbox,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Redirect to custom URL if provided, otherwise to connect page
    let successUrl: URL;
    if (stateData.redirectUrl) {
      successUrl = new URL(stateData.redirectUrl);
    } else {
      successUrl = new URL("/connect", baseUrl);
    }
    successUrl.searchParams.set("oauth_success", "true");
    successUrl.searchParams.set("merchant_id", tokenData.merchantId);
    successUrl.searchParams.set("sandbox", String(isSandbox));

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error("OAuth callback error:", error);
    const baseUrl = getBaseUrl(request);
    const errorUrl = new URL("/connect", baseUrl);
    errorUrl.searchParams.set(
      "oauth_error",
      error instanceof Error ? error.message : "OAuth failed",
    );
    return NextResponse.redirect(errorUrl.toString());
  }
}
