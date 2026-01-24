/**
 * Square configuration helper
 * Returns environment-specific Square settings
 */

export interface SquareConfig {
  applicationId: string;
  locationId: string;
  environment: "sandbox" | "production";
}

/**
 * Get Square config for the specified environment
 * Safe to expose to frontend (no secrets)
 */
export function getSquareConfig(isSandbox: boolean): SquareConfig {
  const applicationId = isSandbox
    ? process.env.SQUARE_SANDBOX_APPLICATION_ID
    : process.env.SQUARE_APPLICATION_ID;

  const locationId = process.env.SQUARE_LOCATION_ID || "";

  if (!applicationId) {
    throw new Error(
      `Missing ${isSandbox ? "SQUARE_SANDBOX_APPLICATION_ID" : "SQUARE_APPLICATION_ID"}`,
    );
  }

  return {
    applicationId,
    locationId,
    environment: isSandbox ? "sandbox" : "production",
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
