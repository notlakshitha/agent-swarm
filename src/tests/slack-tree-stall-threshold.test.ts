import { afterEach, describe, expect, test } from "bun:test";

import { slackTreeStallMinutes } from "../slack/render-v2.ts";

const ENV_KEY = "SLACK_TREE_STALL_MIN";
const originalValue = process.env[ENV_KEY];

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = originalValue;
  }
});

describe("slackTreeStallMinutes", () => {
  test("defaults to 15 when unset", () => {
    delete process.env[ENV_KEY];
    expect(slackTreeStallMinutes()).toBe(15);
  });

  test("keeps a positive integer configuration", () => {
    process.env[ENV_KEY] = "20";
    expect(slackTreeStallMinutes()).toBe(20);
  });

  test("keeps positive fractional minutes", () => {
    for (const value of ["2.5", "0.25", " 1.5 "]) {
      process.env[ENV_KEY] = value;
      expect(slackTreeStallMinutes()).toBe(Number(value));
    }
  });

  test("a negative threshold falls back to 15 instead of marking active tasks stalled", () => {
    // Number("-1") is truthy, so the old `Number(env) || 15` kept -1 and made
    // idleMin >= threshold true for every in-progress task (issue #2801).
    process.env[ENV_KEY] = "-1";
    expect(slackTreeStallMinutes()).toBe(15);
    const idleMin = 0;
    expect(idleMin >= slackTreeStallMinutes()).toBe(false);
  });

  test("zero, blank, and non-finite values fall back to 15", () => {
    for (const value of ["0", "-0.5", "NaN", "Infinity", "-Infinity", "abc", "", "   "]) {
      process.env[ENV_KEY] = value;
      expect(slackTreeStallMinutes()).toBe(15);
    }
  });
});
