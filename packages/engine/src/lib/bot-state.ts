import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_DIR = join(__dirname, "..", "..", "state");

export interface BotState {
  /** Order IDs this bot believes are currently resting, from its last cycle. */
  activeOrderIds: string[];
}

function statePath(botName: string): string {
  return join(STATE_DIR, `${botName}.json`);
}

/** Loads a bot's persisted state, or an empty one if this is a fresh start. */
export function loadBotState(botName: string): BotState {
  const path = statePath(botName);
  if (!existsSync(path)) return { activeOrderIds: [] };
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * Persists state to disk so a killed/restarted process can reconcile against its
 * own last-known resting orders instead of assuming a clean slate — this is what
 * makes cancel-replace idempotent across restarts without needing the Phase 4
 * indexer's owner-indexed order queries.
 */
export function saveBotState(botName: string, state: BotState): void {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(statePath(botName), JSON.stringify(state, null, 2));
}
