import { NextRequest, NextResponse } from 'next/server';
import type { Currency } from 'square';
import { paymentsApi, locationId } from '@/lib/square';
import { PayOrderRequest, PayOrderResponse } from '@/types';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body: PayOrderRequest = await request.json();
    const { orderId, sourceId, amountCents, currency } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Source ID (payment nonce) is required' },
        { status: 400 }
      );
    }

    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Create the payment with Square (v44 SDK uses .create() method)
    const paymentResponse = await paymentsApi.create({
      idempotencyKey: crypto.randomUUID(),
      sourceId: sourceId,
      amountMoney: {
        amount: BigInt(amountCents),
        currency: (currency || 'USD') as Currency,
      },
      orderId: orderId,
      locationId: locationId,
    });

    const payment = paymentResponse.payment;
    if (!payment) {
      return NextResponse.json(
        { error: 'Failed to create payment' },
        { status: 500 }
      );
    }

    const response: PayOrderResponse = {
      paymentId: payment.id!,
      status: payment.status || 'UNKNOWN',
      orderId: payment.orderId || orderId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing payment:', error);

    // Check if it's a Square API error with more details
    if (error && typeof error === 'object' && 'errors' in error) {
      const squareError = error as { errors: Array<{ detail?: string }> };
      return NextResponse.json(
        { error: squareError.errors[0]?.detail || 'Payment failed' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
}
