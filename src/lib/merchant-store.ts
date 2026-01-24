/**
 * Merchant token storage - stores OAuth tokens in a JSON file
 * TODO: Add encryption for prod security
 */

import fs from "fs/promises";
import path from "path";

export interface MerchantTokens {
  merchantId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO date string
  locationId?: string;
  businessName?: string;
  isSandbox: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TokenStore {
  merchants: Record<string, MerchantTokens>;
}

const STORE_PATH = path.join(process.cwd(), "data", "merchants.json");

/**
 * Ensure the data directory and file exist
 */
async function ensureStore(): Promise<void> {
  const dir = path.dirname(STORE_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify({ merchants: {} }, null, 2));
  }
}

/**
 * Read the token store
 */
async function readStore(): Promise<TokenStore> {
  await ensureStore();
  const data = await fs.readFile(STORE_PATH, "utf-8");
  return JSON.parse(data);
}

/**
 * Write the token store
 */
async function writeStore(store: TokenStore): Promise<void> {
  await ensureStore();
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2));
}

/**
 * Store merchant tokens
 */
export async function storeMerchantTokens(
  tokens: MerchantTokens,
): Promise<void> {
  const store = await readStore();
  const key = tokens.isSandbox
    ? `sandbox:${tokens.merchantId}`
    : `prod:${tokens.merchantId}`;

  store.merchants[key] = {
    ...tokens,
    updatedAt: new Date().toISOString(),
  };

  // Also store as "current" for easy access
  const currentKey = tokens.isSandbox ? "current:sandbox" : "current:prod";
  store.merchants[currentKey] = store.merchants[key];

  await writeStore(store);
}

/**
 * Get merchant tokens by ID
 */
export async function getMerchantTokens(
  merchantId: string,
  isSandbox: boolean,
): Promise<MerchantTokens | null> {
  const store = await readStore();
  const key = isSandbox ? `sandbox:${merchantId}` : `prod:${merchantId}`;
  return store.merchants[key] || null;
}

/**
 * Get current (most recently connected) merchant tokens
 */
export async function getCurrentMerchantTokens(
  isSandbox: boolean,
): Promise<MerchantTokens | null> {
  const store = await readStore();
  const key = isSandbox ? "current:sandbox" : "current:prod";
  return store.merchants[key] || null;
}

/**
 * List all merchants
 */
export async function listMerchants(
  isSandbox?: boolean,
): Promise<MerchantTokens[]> {
  const store = await readStore();
  return Object.entries(store.merchants)
    .filter(([key]) => {
      if (key.startsWith("current:")) return false;
      if (isSandbox === undefined) return true;
      return isSandbox ? key.startsWith("sandbox:") : key.startsWith("prod:");
    })
    .map(([, tokens]) => tokens);
}

/**
 * Delete merchant tokens
 */
export async function deleteMerchantTokens(
  merchantId: string,
  isSandbox: boolean,
): Promise<void> {
  const store = await readStore();
  const key = isSandbox ? `sandbox:${merchantId}` : `prod:${merchantId}`;
  delete store.merchants[key];
  await writeStore(store);
}
