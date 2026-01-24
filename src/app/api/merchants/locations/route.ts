import { NextRequest, NextResponse } from "next/server";
import { getCurrentMerchantTokens } from "@/lib/merchant-store";

const SQUARE_PRODUCTION_URL = "https://connect.squareup.com";
const SQUARE_SANDBOX_URL = "https://connect.squareupsandbox.com";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isSandbox = searchParams.get("sandbox") === "true";

    const tokens = await getCurrentMerchantTokens(isSandbox);

    if (!tokens) {
      return NextResponse.json(
        { success: false, error: "Not connected to Square" },
        { status: 401 },
      );
    }

    const baseUrl = isSandbox ? SQUARE_SANDBOX_URL : SQUARE_PRODUCTION_URL;

    const response = await fetch(`${baseUrl}/v2/locations`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
        "Square-Version": "2024-01-18",
      },
    });

    const data = (await response.json()) as {
      locations?: Array<{
        id: string;
        name: string;
        address?: {
          address_line_1?: string;
          locality?: string;
          administrative_district_level_1?: string;
        };
        status: string;
        type?: string;
      }>;
      errors?: Array<{ detail: string }>;
    };

    if (!response.ok || data.errors) {
      throw new Error(data.errors?.[0]?.detail || "Failed to fetch locations");
    }

    return NextResponse.json({
      success: true,
      data: {
        locations:
          data.locations?.map((loc) => ({
            id: loc.id,
            name: loc.name,
            address: loc.address,
            status: loc.status,
            type: loc.type,
          })) || [],
      },
    });
  } catch (error) {
    console.error("Locations error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get locations",
      },
      { status: 500 },
    );
  }
}
