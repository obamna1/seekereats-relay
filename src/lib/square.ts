import { SquareClient, SquareEnvironment } from "square";
import { getCurrentMerchantTokens, getMerchantTokens } from "./merchant-store";

/**
 * Get a Square client for a specific merchant (using OAuth token)
 * If no merchantId provided, tries current merchant, then falls back to env token
 */
export async function getSquareClientForMerchant(
  merchantId?: string,
  isSandbox?: boolean,
): Promise<SquareClient> {
  const sandbox = isSandbox ?? process.env.SQUARE_ENV === "sandbox";

  // If specific merchantId provided, get that merchant's tokens
  if (merchantId) {
    const tokens = await getMerchantTokens(merchantId, sandbox);
    if (!tokens) {
      throw new Error(`No tokens found for merchant ${merchantId}`);
    }
    return new SquareClient({
      token: tokens.accessToken,
      environment: tokens.isSandbox
        ? SquareEnvironment.Sandbox
        : SquareEnvironment.Production,
    });
  }

  // Try to use current merchant tokens
  const tokens = await getCurrentMerchantTokens(sandbox);
  if (tokens) {
    return new SquareClient({
      token: tokens.accessToken,
      environment: tokens.isSandbox
        ? SquareEnvironment.Sandbox
        : SquareEnvironment.Production,
    });
  }

  // Fall back to environment variable token
  const envToken = process.env.SQUARE_SELLER_ACCESS_TOKEN;
  if (!envToken) {
    throw new Error(
      "No merchant connected and SQUARE_SELLER_ACCESS_TOKEN not set",
    );
  }

  return new SquareClient({
    token: envToken,
    environment: sandbox
      ? SquareEnvironment.Sandbox
      : SquareEnvironment.Production,
  });
}

/**
 * Get the default location ID from environment
 */
export function getDefaultLocationId(): string {
  return process.env.SQUARE_LOCATION_ID || "";
}

// Legacy exports for backward compatibility - lazy getters
// These will throw at runtime if env vars are missing, not at import time
let _defaultClient: SquareClient | null = null;

function ensureDefaultClient(): SquareClient {
  if (!_defaultClient) {
    const token = process.env.SQUARE_SELLER_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "SQUARE_SELLER_ACCESS_TOKEN environment variable is not set",
      );
    }
    _defaultClient = new SquareClient({
      token,
      environment:
        process.env.SQUARE_ENV === "sandbox"
          ? SquareEnvironment.Sandbox
          : SquareEnvironment.Production,
    });
  }
  return _defaultClient;
}

// Export getters for legacy code
export const getCatalogApi = () => ensureDefaultClient().catalog;
export const getOrdersApi = () => ensureDefaultClient().orders;
export const getPaymentsApi = () => ensureDefaultClient().payments;
export const getLocationsApi = () => ensureDefaultClient().locations;

// Legacy locationId export
export const locationId = process.env.SQUARE_LOCATION_ID || "";
