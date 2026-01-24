/**
 * Square OAuth utilities
 * Handles authorization URL building, code exchange, and token refresh
 */

const SQUARE_PRODUCTION_URL = "https://connect.squareup.com";
const SQUARE_SANDBOX_URL = "https://connect.squareupsandbox.com";

// OAuth scopes needed for orders and payments
const OAUTH_SCOPES = [
  "MERCHANT_PROFILE_READ",
  "PAYMENTS_WRITE",
  "ORDERS_WRITE",
].join(" ");

/**
 * Build the Square OAuth authorization URL
 */
export function buildAuthorizationUrl(
  redirectUri: string,
  isSandbox: boolean,
  state: string,
): string {
  const baseUrl = isSandbox ? SQUARE_SANDBOX_URL : SQUARE_PRODUCTION_URL;
  const appId = isSandbox
    ? process.env.SQUARE_SANDBOX_APPLICATION_ID
    : process.env.SQUARE_APPLICATION_ID;

  if (!appId) {
    throw new Error(
      `Missing ${isSandbox ? "SQUARE_SANDBOX_APPLICATION_ID" : "SQUARE_APPLICATION_ID"}`,
    );
  }

  const params = new URLSearchParams({
    client_id: appId,
    scope: OAUTH_SCOPES,
    session: "false",
    state: state,
  });

  return `${baseUrl}/oauth2/authorize?${params.toString()}&redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
  isSandbox: boolean,
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  merchantId: string;
}> {
  const baseUrl = isSandbox ? SQUARE_SANDBOX_URL : SQUARE_PRODUCTION_URL;
  const appId = isSandbox
    ? process.env.SQUARE_SANDBOX_APPLICATION_ID
    : process.env.SQUARE_APPLICATION_ID;
  const appSecret = isSandbox
    ? process.env.SQUARE_SANDBOX_APP_SECRET
    : process.env.SQUARE_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Missing Square application credentials");
  }

  const response = await fetch(`${baseUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Square-Version": "2024-01-18",
    },
    body: JSON.stringify({
      client_id: appId,
      client_secret: appSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: string;
    merchant_id?: string;
    errors?: Array<{ detail: string }>;
  };

  if (!response.ok || data.errors) {
    const errorMsg =
      data.errors?.[0]?.detail || "Failed to exchange code for token";
    throw new Error(errorMsg);
  }

  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token!,
    expiresAt: data.expires_at!,
    merchantId: data.merchant_id!,
  };
}

/**
 * Refresh an access token using the refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  isSandbox: boolean,
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}> {
  const baseUrl = isSandbox ? SQUARE_SANDBOX_URL : SQUARE_PRODUCTION_URL;
  const appId = isSandbox
    ? process.env.SQUARE_SANDBOX_APPLICATION_ID
    : process.env.SQUARE_APPLICATION_ID;
  const appSecret = isSandbox
    ? process.env.SQUARE_SANDBOX_APP_SECRET
    : process.env.SQUARE_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error("Missing Square application credentials");
  }

  const response = await fetch(`${baseUrl}/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Square-Version": "2024-01-18",
    },
    body: JSON.stringify({
      client_id: appId,
      client_secret: appSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: string;
    errors?: Array<{ detail: string }>;
  };

  if (!response.ok || data.errors) {
    const errorMsg = data.errors?.[0]?.detail || "Failed to refresh token";
    throw new Error(errorMsg);
  }

  return {
    accessToken: data.access_token!,
    refreshToken: data.refresh_token!,
    expiresAt: data.expires_at!,
  };
}

/**
 * Get merchant info using access token
 */
export async function getMerchantInfo(
  accessToken: string,
  isSandbox: boolean,
): Promise<{ id: string; businessName?: string }> {
  const baseUrl = isSandbox ? SQUARE_SANDBOX_URL : SQUARE_PRODUCTION_URL;

  const response = await fetch(`${baseUrl}/v2/merchants/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-01-18",
    },
  });

  const data = (await response.json()) as {
    merchant?: { id: string; business_name?: string };
    errors?: Array<{ detail: string }>;
  };

  if (!response.ok || data.errors) {
    throw new Error(data.errors?.[0]?.detail || "Failed to get merchant info");
  }

  return {
    id: data.merchant!.id,
    businessName: data.merchant?.business_name,
  };
}

/**
 * Generate a cryptographically secure state parameter
 */
export function generateState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
