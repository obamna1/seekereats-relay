/**
 * OAuth State Storage - Persistent storage for CSRF states
 * Uses file storage in /app/data for Railway persistence
 */

import fs from "fs/promises";
import path from "path";

interface StateData {
  isSandbox: boolean;
  timestamp: number;
}

interface StateStore {
  states: Record<string, StateData>;
}

const STATE_PATH = path.join(process.cwd(), "data", "oauth-states.json");

async function ensureStore(): Promise<void> {
  const dir = path.dirname(STATE_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.access(STATE_PATH);
  } catch {
    await fs.writeFile(STATE_PATH, JSON.stringify({ states: {} }, null, 2));
  }
}

async function readStore(): Promise<StateStore> {
  await ensureStore();
  const data = await fs.readFile(STATE_PATH, "utf-8");
  return JSON.parse(data);
}

async function writeStore(store: StateStore): Promise<void> {
  await ensureStore();
  await fs.writeFile(STATE_PATH, JSON.stringify(store, null, 2));
}

/**
 * Store a state for CSRF validation
 */
export async function setOAuthState(
  state: string,
  data: StateData,
): Promise<void> {
  const store = await readStore();

  // Clean up old states (older than 10 minutes)
  const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
  for (const [key, value] of Object.entries(store.states)) {
    if (value.timestamp < tenMinutesAgo) {
      delete store.states[key];
    }
  }

  store.states[state] = data;
  await writeStore(store);
}

/**
 * Get and delete a state (one-time use)
 */
export async function getAndDeleteOAuthState(
  state: string,
): Promise<StateData | null> {
  const store = await readStore();
  const data = store.states[state];
  if (data) {
    delete store.states[state];
    await writeStore(store);
  }
  return data || null;
}
