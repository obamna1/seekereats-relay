import { NextRequest, NextResponse } from "next/server";
import { getCurrentMerchantTokens, listMerchants } from "@/lib/merchant-store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isSandbox = searchParams.get("sandbox") === "true";
    const listAll = searchParams.get("all") === "true";

    if (listAll) {
      const merchants = await listMerchants(isSandbox);
      return NextResponse.json({
        success: true,
        data: {
          merchants: merchants.map((m) => ({
            merchantId: m.merchantId,
            businessName: m.businessName,
            locationId: m.locationId,
            isSandbox: m.isSandbox,
            expiresAt: m.expiresAt,
          })),
        },
      });
    }

    const tokens = await getCurrentMerchantTokens(isSandbox);

    if (!tokens) {
      return NextResponse.json({
        success: true,
        data: { connected: false },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        connected: true,
        merchantId: tokens.merchantId,
        businessName: tokens.businessName,
        locationId: tokens.locationId,
        expiresAt: tokens.expiresAt,
        isSandbox: tokens.isSandbox,
      },
    });
  } catch (error) {
    console.error("Merchant status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get status",
      },
      { status: 500 },
    );
  }
}
