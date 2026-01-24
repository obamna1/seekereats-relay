import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, getMerchantInfo } from "@/lib/square-oauth";
import { storeMerchantTokens } from "@/lib/merchant-store";
import { stateStore } from "../start/route";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    // Handle OAuth errors
    if (error) {
      const errorUrl = new URL("/", request.nextUrl.origin);
      errorUrl.searchParams.set("oauth_error", errorDescription || error);
      return NextResponse.redirect(errorUrl.toString());
    }

    if (!code || !state) {
      return NextResponse.json(
        { success: false, error: "Missing code or state parameter" },
        { status: 400 },
      );
    }

    // Verify state (CSRF protection)
    const stateData = stateStore.get(state);
    if (!stateData) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired state parameter" },
        { status: 400 },
      );
    }
    stateStore.delete(state);

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

    // Store tokens
    await storeMerchantTokens({
      merchantId: tokenData.merchantId,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresAt,
      businessName: merchantInfo.businessName,
      isSandbox,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Redirect to success page
    const successUrl = new URL("/", request.nextUrl.origin);
    successUrl.searchParams.set("oauth_success", "true");
    successUrl.searchParams.set("merchant_id", tokenData.merchantId);
    successUrl.searchParams.set("sandbox", String(isSandbox));

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    console.error("OAuth callback error:", error);
    const errorUrl = new URL("/", request.nextUrl.origin);
    errorUrl.searchParams.set(
      "oauth_error",
      error instanceof Error ? error.message : "OAuth failed",
    );
    return NextResponse.redirect(errorUrl.toString());
  }
}
