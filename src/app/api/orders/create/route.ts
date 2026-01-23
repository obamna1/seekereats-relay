import { NextRequest, NextResponse } from 'next/server';
import { ordersApi, locationId } from '@/lib/square';
import { CreateOrderRequest, CreateOrderResponse } from '@/types';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { items, fulfillment } = body;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    if (!fulfillment?.displayName || !fulfillment?.phoneNumber || !fulfillment?.pickupAt) {
      return NextResponse.json(
        { error: 'Fulfillment details are required (displayName, phoneNumber, pickupAt)' },
        { status: 400 }
      );
    }

    // Create the order with Square (v44 SDK uses .create() method)
    const orderResponse = await ordersApi.create({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId: locationId,
        lineItems: items.map(item => ({
          catalogObjectId: item.variationId,
          quantity: item.quantity.toString(),
        })),
        fulfillments: [
          {
            type: 'PICKUP',
            state: 'PROPOSED',
            pickupDetails: {
              recipient: {
                displayName: fulfillment.displayName,
                phoneNumber: fulfillment.phoneNumber,
              },
              pickupAt: fulfillment.pickupAt,
              scheduleType: 'SCHEDULED',
            },
          },
        ],
      },
    });

    const order = orderResponse.order;
    if (!order) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    const response: CreateOrderResponse = {
      orderId: order.id!,
      orderVersion: order.version || 1,
      totalAmountCents: Number(order.totalMoney?.amount || 0),
      currency: order.totalMoney?.currency || 'USD',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
