/**
 * Square OAuth utilities
 * Handles authorization URL building, code exchange, and token refresh
 */

const SQUARE_PRODUCTION_URL = "https://connect.squareup.com";
const SQUARE_SANDBOX_URL = "https://connect.squareupsandbox.com";

// OAuth scopes needed for catalog, orders and payments
const OAUTH_SCOPES = [
  "MERCHANT_PROFILE_READ",
  "ITEMS_READ",
  "ORDERS_WRITE",
  "PAYMENTS_WRITE",
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
 * Also fetches the main location ID for payments
 */
export async function getMerchantInfo(
  accessToken: string,
  isSandbox: boolean,
): Promise<{ id: string; businessName?: string; mainLocationId?: string }> {
  const baseUrl = isSandbox ? SQUARE_SANDBOX_URL : SQUARE_PRODUCTION_URL;

  // Fetch merchant info
  const merchantResponse = await fetch(`${baseUrl}/v2/merchants/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": "2024-01-18",
    },
  });

  const merchantData = (await merchantResponse.json()) as {
    merchant?: {
      id: string;
      business_name?: string;
      main_location_id?: string;
    };
    errors?: Array<{ detail: string }>;
  };

  if (!merchantResponse.ok || merchantData.errors) {
    throw new Error(
      merchantData.errors?.[0]?.detail || "Failed to get merchant info",
    );
  }

  // If main_location_id is in merchant data, use it
  let mainLocationId = merchantData.merchant?.main_location_id;

  // If not, fetch locations and use the first active one
  if (!mainLocationId) {
    try {
      const locationsResponse = await fetch(`${baseUrl}/v2/locations`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Square-Version": "2024-01-18",
        },
      });

      const locationsData = (await locationsResponse.json()) as {
        locations?: Array<{ id: string; status?: string }>;
      };

      // Find first active location
      const activeLocation = locationsData.locations?.find(
        (loc) => loc.status === "ACTIVE",
      );
      mainLocationId = activeLocation?.id || locationsData.locations?.[0]?.id;
    } catch (err) {
      console.warn("Failed to fetch locations:", err);
    }
  }

  return {
    id: merchantData.merchant!.id,
    businessName: merchantData.merchant?.business_name,
    mainLocationId,
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
