import { describe, it, expect, afterEach } from "vitest";
import { existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadBotState, saveBotState } from "../src/lib/bot-state.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEST_BOT_NAME = "__vitest_bot_state_test__";
const TEST_STATE_PATH = join(__dirname, "..", "state", `${TEST_BOT_NAME}.json`);

afterEach(() => {
  if (existsSync(TEST_STATE_PATH)) rmSync(TEST_STATE_PATH);
});

describe("bot-state persistence", () => {
  it("returns an empty state for a bot that has never run", () => {
    const state = loadBotState(TEST_BOT_NAME);
    expect(state).toEqual({ activeOrderIds: [] });
  });

  it("round-trips a saved state exactly", () => {
    saveBotState(TEST_BOT_NAME, { activeOrderIds: ["42", "43"] });
    const reloaded = loadBotState(TEST_BOT_NAME);
    expect(reloaded).toEqual({ activeOrderIds: ["42", "43"] });
  });

  it("overwrites rather than merges on repeated saves", () => {
    saveBotState(TEST_BOT_NAME, { activeOrderIds: ["1"] });
    saveBotState(TEST_BOT_NAME, { activeOrderIds: ["2"] });
    expect(loadBotState(TEST_BOT_NAME)).toEqual({ activeOrderIds: ["2"] });
  });
});
