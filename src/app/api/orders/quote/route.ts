import { NextRequest, NextResponse } from "next/server";
import { getSquareClientForMerchant } from "@/lib/square";
import { getSquareConfig } from "@/lib/square-config";

interface QuoteItem {
  variationId: string;
  quantity: number;
}

interface QuoteRequest {
  items: QuoteItem[];
  merchantId?: string;
  sandbox?: boolean;
}

interface ItemBreakdown {
  variationId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

interface QuoteResponse {
  success: boolean;
  totalCents: number;
  currency: string;
  itemBreakdown: ItemBreakdown[];
  estimatedPickupMinutes: number;
}

/**
 * Quote endpoint - calculates order total from Square catalog prices
 * This is called BEFORE payment to show the customer what they'll pay
 */
export async function POST(request: NextRequest) {
  try {
    const body: QuoteRequest = await request.json();
    const { items, merchantId, sandbox } = body;
    const isSandbox = sandbox ?? true;

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided" },
        { status: 400 },
      );
    }

    // Get Square client
    const client = await getSquareClientForMerchant(merchantId, isSandbox);

    // Get all variation IDs to fetch from catalog
    const variationIds = items.map((item) => item.variationId);

    // Batch retrieve catalog objects to get prices
    const catalogResponse = await client.catalog.batchGet({
      objectIds: variationIds,
      includeRelatedObjects: true,
    });

    const objects = catalogResponse.objects || [];

    // Build price lookup map
    const priceMap = new Map<
      string,
      { name: string; priceCents: number; currency: string }
    >();

    for (const obj of objects) {
      if (obj.type === "ITEM_VARIATION" && obj.itemVariationData) {
        const priceMoney = obj.itemVariationData.priceMoney;
        priceMap.set(obj.id, {
          name: obj.itemVariationData.name || "Item",
          priceCents: Number(priceMoney?.amount || 0),
          currency: priceMoney?.currency || "USD",
        });
      }
    }

    // Calculate breakdown and total
    const itemBreakdown: ItemBreakdown[] = [];
    let totalCents = 0;
    let currency = "USD";

    for (const item of items) {
      const priceInfo = priceMap.get(item.variationId);

      if (!priceInfo) {
        return NextResponse.json(
          { success: false, error: `Item not found: ${item.variationId}` },
          { status: 400 },
        );
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

    const response: QuoteResponse = {
      success: true,
      totalCents,
      currency,
      itemBreakdown,
      estimatedPickupMinutes: 15,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error quoting order:", error);
    return NextResponse.json(
      { success: false, error: "Failed to quote order" },
      { status: 500 },
    );
  }
}
