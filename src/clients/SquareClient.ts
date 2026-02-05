/**
 * Square API Client for Express backend
 * Supports both sandbox and production environments with OAuth or env token
 */

import { SquareClient, SquareEnvironment } from 'square';
import { getCurrentMerchantTokens, getMerchantTokens, MerchantTokens } from '../lib/merchant-store';

// Environment configuration
const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const COMPANY_CARD_TOKEN = process.env.COMPANY_CARD_TOKEN || 'cnon:card-nonce-ok';

// Client cache per environment
const clientCache: { sandbox: SquareClient | null; production: SquareClient | null } = {
  sandbox: null,
  production: null,
};

/**
 * Get Square client for a specific environment
 * Tries OAuth tokens first, falls back to env vars
 */
export async function getClient(isSandbox = true): Promise<SquareClient> {
  // Try to get OAuth tokens first
  const tokens = await getCurrentMerchantTokens(isSandbox);

  if (tokens) {
    console.log(`[SquareClient] Using OAuth token for ${tokens.businessName || tokens.merchantId}`);
    return new SquareClient({
      token: tokens.accessToken,
      environment: isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
    });
  }

  // Fall back to environment variable
  if (!SQUARE_ACCESS_TOKEN) {
    throw new Error(
      `No ${isSandbox ? 'sandbox' : 'production'} merchant connected and SQUARE_ACCESS_TOKEN not set`
    );
  }

  const cacheKey = isSandbox ? 'sandbox' : 'production';
  if (!clientCache[cacheKey]) {
    clientCache[cacheKey] = new SquareClient({
      token: SQUARE_ACCESS_TOKEN,
      environment: isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production,
    });
  }

  return clientCache[cacheKey]!;
}

/**
 * Get location ID for the current environment
 */
export async function getLocationId(isSandbox = true): Promise<string> {
  // Try OAuth tokens first
  const tokens = await getCurrentMerchantTokens(isSandbox);
  if (tokens?.locationId) {
    return tokens.locationId;
  }

  // Fall back to env var
  if (SQUARE_LOCATION_ID) {
    return SQUARE_LOCATION_ID;
  }

  throw new Error(`No location ID configured for ${isSandbox ? 'sandbox' : 'production'}`);
}

/**
 * Fetch menu items from Square Catalog
 */
export async function getMenu(isSandbox = true): Promise<{
  items: Array<{
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    variations: Array<{
      id: string;
      name: string;
      priceCents: number;
      currency: string;
    }>;
  }>;
}> {
  const client = await getClient(isSandbox);

  const response = await client.catalog.list({
    types: 'ITEM',
  });

  const items = [];

  for await (const obj of response) {
    if (obj.type === 'ITEM' && obj.itemData) {
      const variations = (obj.itemData.variations || []).map((v: any) => ({
        id: v.id || '',
        name: v.itemVariationData?.name || 'Regular',
        priceCents: Number(v.itemVariationData?.priceMoney?.amount || 0),
        currency: v.itemVariationData?.priceMoney?.currency || 'USD',
      }));

      items.push({
        id: obj.id || '',
        name: obj.itemData.name || 'Unnamed Item',
        description: obj.itemData.description || '',
        imageUrl: null,
        variations,
      });
    }
  }

  return { items };
}

/**
 * Quote an order - calculate total from catalog prices
 */
export async function quoteOrder(
  items: Array<{ variationId: string; quantity: number }>,
  isSandbox = true
): Promise<{
  totalCents: number;
  currency: string;
  itemBreakdown: Array<{
    variationId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
}> {
  const client = await getClient(isSandbox);

  // Batch retrieve catalog objects
  const variationIds = items.map((item) => item.variationId);
  const catalogResponse = await client.catalog.batchGet({
    objectIds: variationIds,
    includeRelatedObjects: true,
  });

  const objects = catalogResponse.objects || [];
  const priceMap = new Map<string, { name: string; priceCents: number; currency: string }>();

  for (const obj of objects) {
    const variationData = (obj as any).itemVariationData;
    if (obj.type === 'ITEM_VARIATION' && variationData) {
      const priceMoney = variationData.priceMoney;
      priceMap.set(obj.id || '', {
        name: variationData.name || 'Item',
        priceCents: Number(priceMoney?.amount || 0),
        currency: priceMoney?.currency || 'USD',
      });
    }
  }

  const itemBreakdown = [];
  let totalCents = 0;
  let currency = 'USD';

  for (const item of items) {
    const priceInfo = priceMap.get(item.variationId);
    if (!priceInfo) {
      throw new Error(`Item not found: ${item.variationId}`);
    }

    const itemTotal = priceInfo.priceCents * item.quantity;
    totalCents += itemTotal;
    currency = priceInfo.currency;

    itemBreakdown.push({
      variationId: item.variationId,
      name: priceInfo.name,
      quantity: item.quantity,
      unitPriceCents: priceInfo.priceCents,
      totalCents: itemTotal,
    });
  }

  return { totalCents, currency, itemBreakdown };
}

/**
 * Create a Square order
 */
export async function createOrder(params: {
  items: Array<{ variationId: string; quantity: number }>;
  fulfillment: {
    displayName: string;
    phoneNumber: string;
    pickupAt?: string;
  };
  isSandbox?: boolean;
}): Promise<{
  orderId: string;
  orderVersion: number;
  totalAmountCents: number;
  currency: string;
}> {
  const isSandbox = params.isSandbox ?? true;
  const client = await getClient(isSandbox);
  const locationId = await getLocationId(isSandbox);
  const { items, fulfillment } = params;

  // Default pickup time: 15 minutes from now
  const pickupTime = new Date();
  pickupTime.setMinutes(pickupTime.getMinutes() + 15);

  const response = await client.orders.create({
    idempotencyKey: crypto.randomUUID(),
    order: {
      locationId,
      lineItems: items.map((item) => ({
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
            pickupAt: fulfillment.pickupAt || pickupTime.toISOString(),
            scheduleType: 'ASAP',
          },
        },
      ],
    },
  });

  const order = response.order;
  if (!order?.id) {
    throw new Error('Failed to create order');
  }

  return {
    orderId: order.id,
    orderVersion: order.version || 1,
    totalAmountCents: Number(order.totalMoney?.amount || 0),
    currency: order.totalMoney?.currency || 'USD',
  };
}

/**
 * Pay for an order using the company card token
 */
export async function payOrder(params: {
  orderId: string;
  amountCents: number;
  currency?: string;
  note?: string;
  isSandbox?: boolean;
}): Promise<{
  paymentId: string;
  status: string;
  orderId: string;
}> {
  const isSandbox = params.isSandbox ?? true;
  const client = await getClient(isSandbox);
  const locationId = await getLocationId(isSandbox);
  const { orderId, amountCents, currency = 'USD', note } = params;

  const response = await client.payments.create({
    idempotencyKey: crypto.randomUUID(),
    sourceId: COMPANY_CARD_TOKEN,
    amountMoney: {
      amount: BigInt(amountCents),
      currency: currency as any,
    },
    orderId,
    locationId,
    note: note || 'SeekerEats order',
  });

  const payment = response.payment;
  if (!payment?.id) {
    throw new Error('Failed to process payment');
  }

  return {
    paymentId: payment.id,
    status: payment.status || 'COMPLETED',
    orderId,
  };
}

/**
 * Get Square configuration status
 */
export async function getConfig(isSandbox = true): Promise<{
  configured: boolean;
  environment: string;
  locationId?: string;
  merchantName?: string;
  usingOAuth: boolean;
}> {
  const tokens = await getCurrentMerchantTokens(isSandbox);

  if (tokens) {
    return {
      configured: true,
      environment: isSandbox ? 'sandbox' : 'production',
      locationId: tokens.locationId,
      merchantName: tokens.businessName,
      usingOAuth: true,
    };
  }

  return {
    configured: !!(SQUARE_ACCESS_TOKEN && SQUARE_LOCATION_ID),
    environment: isSandbox ? 'sandbox' : 'production',
    locationId: SQUARE_LOCATION_ID,
    usingOAuth: false,
  };
}
