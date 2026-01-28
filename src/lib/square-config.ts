/**
 * Square configuration helper
 * Returns environment-specific Square settings with dynamic location from OAuth
 */

import { getCurrentMerchantTokens, getMerchantTokens } from "./merchant-store";

export interface SquareConfig {
  applicationId: string;
  locationId: string;
  environment: "sandbox" | "production";
  merchantId?: string;
  merchantName?: string;
}

/**
 * Get Square config for the specified environment
 * Pulls location dynamically from OAuth tokens instead of env vars
 */
export async function getSquareConfig(
  isSandbox: boolean,
  merchantId?: string,
): Promise<SquareConfig> {
  const applicationId = isSandbox
    ? process.env.SQUARE_SANDBOX_APPLICATION_ID
    : process.env.SQUARE_APPLICATION_ID;

  if (!applicationId) {
    throw new Error(
      `Missing ${isSandbox ? "SQUARE_SANDBOX_APPLICATION_ID" : "SQUARE_APPLICATION_ID"}`,
    );
  }

  // Get merchant from OAuth store - either specific or current
  const merchant = merchantId
    ? await getMerchantTokens(merchantId, isSandbox)
    : await getCurrentMerchantTokens(isSandbox);

  if (!merchant) {
    throw new Error(
      `No ${isSandbox ? "sandbox" : "production"} merchant connected. Please complete OAuth first.`,
    );
  }

  if (!merchant.locationId) {
    throw new Error(
      `Merchant ${merchant.businessName || merchant.merchantId} has no location ID stored.`,
    );
  }

  return {
    applicationId,
    locationId: merchant.locationId,
    environment: isSandbox ? "sandbox" : "production",
    merchantId: merchant.merchantId,
    merchantName: merchant.businessName,
  };
}

/**
 * Get the URL for Square Web Payments SDK
 */
export function getWebPaymentsSdkUrl(isSandbox: boolean): string {
  return isSandbox
    ? "https://sandbox.web.squarecdn.com/v1/square.js"
    : "https://web.squarecdn.com/v1/square.js";
}
