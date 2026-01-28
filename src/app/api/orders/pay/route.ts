import { NextRequest, NextResponse } from "next/server";
import type { Currency } from "square";
import { getSquareClientForMerchant } from "@/lib/square";
import { getSquareConfig } from "@/lib/square-config";
import { PayOrderRequest, PayOrderResponse } from "@/types";
import crypto from "crypto";

interface ExtendedPayOrderRequest extends PayOrderRequest {
  merchantId?: string;
  locationId?: string;
  sandbox?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtendedPayOrderRequest = await request.json();
    const {
      orderId,
      sourceId,
      amountCents,
      currency,
      merchantId,
      locationId,
      sandbox,
    } = body;
    const isSandbox = sandbox ?? true; // Default to sandbox for safety

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );
    }

    if (!sourceId) {
      return NextResponse.json(
        { error: "Source ID (payment nonce) is required" },
        { status: 400 },
      );
    }

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 },
      );
    }

    // Get Square client (uses merchant token if available, otherwise default)
    const client = await getSquareClientForMerchant(merchantId, isSandbox);

    // Get locationId: prefer explicit param, then from OAuth tokens
    let targetLocationId = locationId;
    if (!targetLocationId) {
      try {
        const config = await getSquareConfig(isSandbox, merchantId);
        targetLocationId = config.locationId;
      } catch (err) {
        console.error("Failed to get location from config:", err);
      }
    }

    if (!targetLocationId) {
      return NextResponse.json(
        { error: "Location ID is required - please connect via OAuth first" },
        { status: 400 },
      );
    }

    // Create the payment with Square (v44 SDK uses .create() method)
    const paymentResponse = await client.payments.create({
      idempotencyKey: crypto.randomUUID(),
      sourceId: sourceId,
      amountMoney: {
        amount: BigInt(amountCents),
        currency: (currency || "USD") as Currency,
      },
      orderId: orderId,
      locationId: targetLocationId,
    });

    const payment = paymentResponse.payment;
    if (!payment) {
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 },
      );
    }

    const response: PayOrderResponse = {
      paymentId: payment.id!,
      status: payment.status || "UNKNOWN",
      orderId: payment.orderId || orderId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error processing payment:", error);

    // Check if it's a Square API error with more details
    if (error && typeof error === "object" && "errors" in error) {
      const squareError = error as { errors: Array<{ detail?: string }> };
      return NextResponse.json(
        { error: squareError.errors[0]?.detail || "Payment failed" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 },
    );
  }
}
