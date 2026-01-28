import { NextRequest, NextResponse } from "next/server";
import { getSquareConfig, getWebPaymentsSdkUrl } from "@/lib/square-config";

/**
 * GET /api/config?sandbox=true&merchantId=optional
 * Returns Square configuration for frontend (no secrets)
 * Location is pulled dynamically from OAuth tokens
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isSandbox = searchParams.get("sandbox") !== "false"; // Default to sandbox
    const merchantId = searchParams.get("merchantId") || undefined;

    const config = await getSquareConfig(isSandbox, merchantId);
    const sdkUrl = getWebPaymentsSdkUrl(isSandbox);

    return NextResponse.json({
      success: true,
      data: {
        applicationId: config.applicationId,
        locationId: config.locationId,
        environment: config.environment,
        merchantId: config.merchantId,
        merchantName: config.merchantName,
        sdkUrl,
      },
    });
  } catch (error) {
    console.error("Config error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get config",
      },
      { status: 500 },
    );
  }
}
