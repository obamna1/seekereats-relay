import { NextResponse } from "next/server";
import { getCatalogApi } from "@/lib/square";
import { MenuItem, MenuResponse } from "@/types";

// Type helpers for Square catalog objects
interface SquareMoney {
  amount?: bigint;
  currency?: string;
}

interface SquareVariationData {
  name?: string;
  priceMoney?: SquareMoney;
}

interface SquareVariation {
  id: string;
  itemVariationData?: SquareVariationData;
}

interface SquareItemData {
  name?: string;
  description?: string;
  imageIds?: string[];
  variations?: SquareVariation[];
}

interface SquareImageData {
  url?: string;
}

interface SquareCatalogObject {
  id: string;
  type?: string;
  itemData?: SquareItemData;
  imageData?: SquareImageData;
}

export async function GET() {
  try {
    // Fetch catalog items from Square (v44 SDK uses pagination)
    const catalogObjects: SquareCatalogObject[] = [];
    const catalogApi = getCatalogApi();
    const catalogPage = await catalogApi.list({ types: "ITEM" });
    for await (const item of catalogPage) {
      catalogObjects.push(item as SquareCatalogObject);
    }

    // Collect image IDs
    const imageIds: string[] = [];
    catalogObjects.forEach((obj) => {
      if (obj.itemData?.imageIds) {
        imageIds.push(...obj.itemData.imageIds);
      }
    });

    // Fetch images if any exist
    const imageMap: Record<string, string> = {};
    if (imageIds.length > 0) {
      try {
        const imageResponse = await catalogApi.batchGet({
          objectIds: imageIds,
        });
        const imageObjects = (imageResponse.objects ||
          []) as SquareCatalogObject[];
        imageObjects.forEach((img) => {
          if (img.id && img.imageData?.url) {
            imageMap[img.id] = img.imageData.url;
          }
        });
      } catch {
        // Continue without images if fetch fails
        console.warn("Failed to fetch images");
      }
    }

    // Transform catalog items to our response format
    const items: MenuItem[] = catalogObjects
      .filter((obj) => obj.type === "ITEM" && obj.itemData)
      .map((obj) => {
        const itemData = obj.itemData!;
        const imageId = itemData.imageIds?.[0];

        return {
          id: obj.id,
          name: itemData.name || "Unnamed Item",
          description: itemData.description || "",
          imageUrl: imageId ? imageMap[imageId] || null : null,
          variations: (itemData.variations || []).map((variation) => ({
            id: variation.id,
            name: variation.itemVariationData?.name || "Regular",
            priceCents: Number(
              variation.itemVariationData?.priceMoney?.amount || 0,
            ),
            currency:
              variation.itemVariationData?.priceMoney?.currency || "USD",
          })),
        };
      });

    const response: MenuResponse = { items };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 },
    );
  }
}
