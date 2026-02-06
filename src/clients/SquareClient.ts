/**
 * Square API Client for Express backend
 *
 * SANDBOX MODE:
 * - Uses SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID from env vars
 * - Uses SquareEnvironment.Sandbox (connect.squareupsandbox.com)
 *
 * PRODUCTION MODE:
 * - Uses OAuth tokens from merchant-store (or env var fallback)
 * - Uses SquareEnvironment.Production (connect.squareup.com)
 */

import { SquareClient, SquareEnvironment } from 'square';
import { getCurrentMerchant, getMerchantBySquareId } from '../services/merchantService';

// Sandbox credentials (from Developer Console)
const SANDBOX_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SANDBOX_LOCATION_ID = process.env.SQUARE_LOCATION_ID;

// Production fallback (only used if no OAuth tokens)
const PROD_ACCESS_TOKEN = process.env.SQUARE_PROD_ACCESS_TOKEN;
const PROD_LOCATION_ID = process.env.SQUARE_PROD_LOCATION_ID;

// Company card token for payments
const COMPANY_CARD_TOKEN = process.env.COMPANY_CARD_TOKEN || 'cnon:card-nonce-ok';

/**
 * Get Square client for specified environment (uses default/first merchant)
 */
export async function getClient(isSandbox: boolean): Promise<SquareClient> {
  if (isSandbox) {
    // Sandbox: use env var access token
    if (!SANDBOX_ACCESS_TOKEN) {
      throw new Error('SQUARE_ACCESS_TOKEN not set for sandbox');
    }
    return new SquareClient({
      token: SANDBOX_ACCESS_TOKEN,
      environment: SquareEnvironment.Sandbox,
    });
  }

  // Production: try OAuth first, then env var fallback
  const oauthMerchant = await getCurrentMerchant(false);
  if (oauthMerchant) {
    console.log(
      `[Square] Using OAuth tokens for ${oauthMerchant.businessName || oauthMerchant.merchantId}`
    );
    return new SquareClient({
      token: oauthMerchant.accessToken,
      environment: SquareEnvironment.Production,
    });
  }

  // Fallback to prod env var
  if (!PROD_ACCESS_TOKEN) {
    throw new Error('No production OAuth tokens and SQUARE_PROD_ACCESS_TOKEN not set');
  }
  return new SquareClient({
    token: PROD_ACCESS_TOKEN,
    environment: SquareEnvironment.Production,
  });
}

/**
 * Get Square client for a specific merchant by Square merchant ID
 */
export async function getClientForMerchant(
  merchantId: string,
  isSandbox: boolean
): Promise<{ client: SquareClient; locationId: string }> {
  if (isSandbox) {
    // Sandbox: use env var access token
    if (!SANDBOX_ACCESS_TOKEN || !SANDBOX_LOCATION_ID) {
      throw new Error('Sandbox credentials not configured');
    }
    return {
      client: new SquareClient({
        token: SANDBOX_ACCESS_TOKEN,
        environment: SquareEnvironment.Sandbox,
      }),
      locationId: SANDBOX_LOCATION_ID,
    };
  }

  // Production: get specific merchant from database
  const merchant = await getMerchantBySquareId(merchantId, isSandbox);
  if (!merchant) {
    throw new Error(`Merchant ${merchantId} not found`);
  }

  if (!merchant.locationId) {
    throw new Error(`Merchant ${merchantId} has no location configured`);
  }

  return {
    client: new SquareClient({
      token: merchant.accessToken,
      environment: SquareEnvironment.Production,
    }),
    locationId: merchant.locationId,
  };
}

/**
 * Get location ID for specified environment (uses default/first merchant)
 */
export async function getLocationId(isSandbox: boolean): Promise<string> {
  if (isSandbox) {
    if (!SANDBOX_LOCATION_ID) {
      throw new Error('SQUARE_LOCATION_ID not set for sandbox');
    }
    return SANDBOX_LOCATION_ID;
  }

  // Production: try OAuth first
  const oauthMerchant = await getCurrentMerchant(false);
  if (oauthMerchant?.locationId) {
    return oauthMerchant.locationId;
  }

  if (!PROD_LOCATION_ID) {
    throw new Error('No production OAuth location and SQUARE_PROD_LOCATION_ID not set');
  }
  return PROD_LOCATION_ID;
}

/**
 * Fetch menu items from Square Catalog
 */
export async function getMenu(isSandbox: boolean): Promise<{
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
  const response = await client.catalog.list({ types: 'ITEM' });

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
  isSandbox: boolean
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
      priceMap.set(obj.id || '', {
        name: variationData.name || 'Item',
        priceCents: Number(variationData.priceMoney?.amount || 0),
        currency: variationData.priceMoney?.currency || 'USD',
      });
    }
  }

  const itemBreakdown = [];
  let totalCents = 0;
  let currency = 'USD';

  for (const item of items) {
    const priceInfo = priceMap.get(item.variationId);
    if (!priceInfo) throw new Error(`Item not found: ${item.variationId}`);

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
  fulfillment: { displayName: string; phoneNumber: string; pickupAt?: string };
  isSandbox: boolean;
}): Promise<{
  orderId: string;
  orderVersion: number;
  totalAmountCents: number;
  currency: string;
}> {
  const { items, fulfillment, isSandbox } = params;
  const client = await getClient(isSandbox);
  const locationId = await getLocationId(isSandbox);

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
  if (!order?.id) throw new Error('Failed to create order');

  return {
    orderId: order.id,
    orderVersion: order.version || 1,
    totalAmountCents: Number(order.totalMoney?.amount || 0),
    currency: order.totalMoney?.currency || 'USD',
  };
}

/**
 * Pay for an order using company card
 */
export async function payOrder(params: {
  orderId: string;
  amountCents: number;
  currency?: string;
  note?: string;
  isSandbox: boolean;
}): Promise<{
  paymentId: string;
  status: string;
  orderId: string;
}> {
  const { orderId, amountCents, currency = 'USD', note, isSandbox } = params;
  const client = await getClient(isSandbox);
  const locationId = await getLocationId(isSandbox);

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
  if (!payment?.id) throw new Error('Failed to process payment');

  return {
    paymentId: payment.id,
    status: payment.status || 'COMPLETED',
    orderId,
  };
}

/**
 * Get configuration status
 */
export async function getConfig(isSandbox: boolean): Promise<{
  configured: boolean;
  environment: string;
  locationId?: string;
  merchantName?: string;
}> {
  try {
    const locationId = await getLocationId(isSandbox);

    if (!isSandbox) {
      const merchant = await getCurrentMerchant(false);
      if (merchant) {
        return {
          configured: true,
          environment: 'production',
          locationId,
          merchantName: merchant.businessName ?? undefined,
        };
      }
    }

    return {
      configured: true,
      environment: isSandbox ? 'sandbox' : 'production',
      locationId,
    };
  } catch {
    return {
      configured: false,
      environment: isSandbox ? 'sandbox' : 'production',
    };
  }
}
