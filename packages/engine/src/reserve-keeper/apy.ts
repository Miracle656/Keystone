import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const STATE_PATH = join(__dirname, "..", "..", "state", "reserve-apy.json");

export interface ApyState {
  firstObservedAtMs: number;
  /** Share price (totalAssets/totalSupply), 1e18-scaled, at first observation. */
  firstSharePrice1e18: string;
}

export function loadApyState(): ApyState | undefined {
  if (!existsSync(STATE_PATH)) return undefined;
  return JSON.parse(readFileSync(STATE_PATH, "utf8"));
}

export function saveApyState(state: ApyState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}
