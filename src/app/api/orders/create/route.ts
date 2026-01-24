import { NextRequest, NextResponse } from "next/server";
import {
  getSquareClientForMerchant,
  locationId as defaultLocationId,
} from "@/lib/square";
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

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    if (
      !fulfillment?.displayName ||
      !fulfillment?.phoneNumber ||
      !fulfillment?.pickupAt
    ) {
      return NextResponse.json(
        {
          error:
            "Fulfillment details are required (displayName, phoneNumber, pickupAt)",
        },
        { status: 400 },
      );
    }

    // Get Square client (uses merchant token if available, otherwise default)
    const client = await getSquareClientForMerchant(merchantId, sandbox);
    const targetLocationId = locationId || defaultLocationId;

    if (!targetLocationId) {
      return NextResponse.json(
        { error: "Location ID is required" },
        { status: 400 },
      );
    }

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
              pickupAt: fulfillment.pickupAt,
              scheduleType: "SCHEDULED",
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
