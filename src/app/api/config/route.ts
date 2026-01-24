import { NextRequest, NextResponse } from "next/server";
import { getSquareConfig, getWebPaymentsSdkUrl } from "@/lib/square-config";

/**
 * GET /api/config?sandbox=true
 * Returns Square configuration for frontend (no secrets)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isSandbox = searchParams.get("sandbox") !== "false"; // Default to sandbox

    const config = getSquareConfig(isSandbox);
    const sdkUrl = getWebPaymentsSdkUrl(isSandbox);

    return NextResponse.json({
      success: true,
      data: {
        applicationId: config.applicationId,
        locationId: config.locationId,
        environment: config.environment,
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
