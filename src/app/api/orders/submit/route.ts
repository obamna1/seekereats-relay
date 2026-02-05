import { NextRequest, NextResponse } from "next/server";
import { getSquareClientForMerchant } from "@/lib/square";
import { getSquareConfig } from "@/lib/square-config";
import { validateSolanaPayment } from "@/lib/solana-validator";
import crypto from "crypto";

interface SubmitOrderItem {
  variationId: string;
  quantity: number;
}

interface SubmitOrderRequest {
  items: SubmitOrderItem[];
  fulfillment: {
    displayName: string;
    phoneNumber: string;
    pickupAt?: string;
  };
  solanaTxSignature: string;
  expectedTotalCents: number;
  merchantId?: string;
  sandbox?: boolean;
  useTestCard?: boolean;
}

interface SubmitOrderResponse {
  success: boolean;
  orderId?: string;
  paymentId?: string;
  status?: string;
  error?: string;
}

/**
 * Submit Order endpoint - validates Solana payment then creates Square order
 *
 * Flow:
 * 1. Validate Solana transaction on-chain
 * 2. Create Square order
 * 3. Pay using company card token
 * 4. Return confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const body: SubmitOrderRequest = await request.json();
    const {
      items,
      fulfillment,
      solanaTxSignature,
      expectedTotalCents,
      merchantId,
      sandbox,
      useTestCard,
    } = body;

    const isSandbox = sandbox ?? true;

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided" },
        { status: 400 },
      );
    }

    if (!fulfillment?.displayName || !fulfillment?.phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Fulfillment details required" },
        { status: 400 },
      );
    }

    if (!solanaTxSignature) {
      return NextResponse.json(
        { success: false, error: "Solana transaction signature required" },
        { status: 400 },
      );
    }

    // ====================================================
    // STEP 1: Validate Solana payment
    // ====================================================
    console.log("[SubmitOrder] Validating Solana tx:", solanaTxSignature);

    const validationResult = await validateSolanaPayment({
      signature: solanaTxSignature,
      expectedAmountCents: expectedTotalCents,
      isTestMode: isSandbox, // In sandbox, skip strict validation
    });

    if (!validationResult.valid) {
      console.error(
        "[SubmitOrder] Solana validation failed:",
        validationResult.error,
      );
      return NextResponse.json(
        {
          success: false,
          error: `Payment validation failed: ${validationResult.error}`,
        },
        { status: 400 },
      );
    }

    console.log("[SubmitOrder] Solana payment validated successfully");

    // ====================================================
    // STEP 2: Create Square order
    // ====================================================
    const client = await getSquareClientForMerchant(merchantId, isSandbox);

    // Get location ID
    let locationId: string | undefined;
    try {
      const config = await getSquareConfig(isSandbox, merchantId);
      locationId = config.locationId;
    } catch (err) {
      console.error("[SubmitOrder] Failed to get location:", err);
    }

    if (!locationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Location ID required - connect via OAuth first",
        },
        { status: 400 },
      );
    }

    // Calculate pickup time
    const pickupTime = new Date();
    pickupTime.setMinutes(pickupTime.getMinutes() + 15);

    const orderResponse = await client.orders.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId,
        lineItems: items.map((item) => ({
          catalogObjectId: item.variationId,
          quantity: item.quantity.toString(),
        })),
        fulfillments: [
          {
            type: "PICKUP",
            state: "PROPOSED",
            pickupDetails: {
              recipient: {
                displayName: fulfillment.displayName,
                phoneNumber: fulfillment.phoneNumber,
              },
              pickupAt: fulfillment.pickupAt || pickupTime.toISOString(),
              scheduleType: "ASAP",
            },
          },
        ],
      },
    });

    const order = orderResponse.order;
    if (!order?.id) {
      return NextResponse.json(
        { success: false, error: "Failed to create Square order" },
        { status: 500 },
      );
    }

    console.log("[SubmitOrder] Square order created:", order.id);

    // ====================================================
    // STEP 3: Pay with company card
    // ====================================================

    // Get card token from environment
    let cardToken: string;
    if (useTestCard || isSandbox) {
      // Use sandbox test card token
      cardToken = process.env.COMPANY_CARD_TOKEN || "cnon:card-nonce-ok";
    } else {
      // Use production company card
      const prodToken = process.env.COMPANY_CARD_TOKEN_PROD;
      if (!prodToken) {
        console.error("[SubmitOrder] COMPANY_CARD_TOKEN_PROD not configured");
        return NextResponse.json(
          { success: false, error: "Payment configuration error" },
          { status: 500 },
        );
      }
      cardToken = prodToken;
    }

    const paymentResponse = await client.payments.create({
      idempotencyKey: crypto.randomUUID(),
      sourceId: cardToken,
      amountMoney: {
        amount: BigInt(order.totalMoney?.amount || expectedTotalCents),
        currency: (order.totalMoney?.currency || "USD") as any,
      },
      orderId: order.id,
      locationId,
      note: `SeekerEats order - Solana tx: ${solanaTxSignature.slice(0, 20)}...`,
    });

    const payment = paymentResponse.payment;
    if (!payment?.id) {
      return NextResponse.json(
        { success: false, error: "Payment processing failed" },
        { status: 500 },
      );
    }

    console.log("[SubmitOrder] Payment completed:", payment.id, payment.status);

    // ====================================================
    // STEP 4: Return success
    // ====================================================
    const response: SubmitOrderResponse = {
      success: true,
      orderId: order.id,
      paymentId: payment.id,
      status: payment.status || "COMPLETED",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[SubmitOrder] Error:", error);

    // Handle Square API errors
    if (error && typeof error === "object" && "errors" in error) {
      const squareError = error as { errors: Array<{ detail?: string }> };
      return NextResponse.json(
        {
          success: false,
          error: squareError.errors[0]?.detail || "Order failed",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to submit order" },
      { status: 500 },
    );
  }
}
