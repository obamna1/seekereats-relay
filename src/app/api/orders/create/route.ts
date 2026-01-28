import { NextRequest, NextResponse } from "next/server";
import { getSquareClientForMerchant } from "@/lib/square";
import { getSquareConfig } from "@/lib/square-config";
import { CreateOrderRequest, CreateOrderResponse } from "@/types";
import crypto from "crypto";

interface ExtendedCreateOrderRequest extends CreateOrderRequest {
  merchantId?: string;
  locationId?: string;
  sandbox?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ExtendedCreateOrderRequest = await request.json();
    const { items, fulfillment, merchantId, locationId, sandbox } = body;
    const isSandbox = sandbox ?? true; // Default to sandbox for safety

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    if (!fulfillment?.displayName || !fulfillment?.phoneNumber) {
      return NextResponse.json(
        {
          error: "Fulfillment details are required (displayName, phoneNumber)",
        },
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

    // Calculate pickup time: ASAP with 15-min prep buffer
    const pickupTime = new Date();
    pickupTime.setMinutes(pickupTime.getMinutes() + 15);
    const pickupAt = fulfillment.pickupAt || pickupTime.toISOString();

    // Create the order with Square (v44 SDK uses .create() method)
    const orderResponse = await client.orders.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId: targetLocationId,
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
              pickupAt: pickupAt,
              scheduleType: "ASAP",
            },
          },
        ],
      },
    });

    const order = orderResponse.order;
    if (!order) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      );
    }

    const response: CreateOrderResponse = {
      orderId: order.id!,
      orderVersion: order.version || 1,
      totalAmountCents: Number(order.totalMoney?.amount || 0),
      currency: order.totalMoney?.currency || "USD",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
