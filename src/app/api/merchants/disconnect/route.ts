import { NextRequest, NextResponse } from "next/server";
import {
  deleteMerchantTokens,
  getCurrentMerchantTokens,
} from "@/lib/merchant-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const isSandbox = body.sandbox ?? false;

    // Get current merchant to know which one to delete
    const tokens = await getCurrentMerchantTokens(isSandbox);

    if (!tokens) {
      return NextResponse.json({
        success: true,
        message: "No merchant connected",
      });
    }

    // Delete the merchant tokens
    await deleteMerchantTokens(tokens.merchantId, isSandbox);

    return NextResponse.json({
      success: true,
      message: `Disconnected ${tokens.businessName || tokens.merchantId}`,
    });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to disconnect",
      },
      { status: 500 },
    );
  }
}
