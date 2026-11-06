import { afterEach, describe, expect, test } from "bun:test";

import { runtimeStaleThresholdMinutes } from "../be/multi-runtime.ts";

const ENV_KEY = "RUNTIME_STALE_THRESHOLD_MIN";
const originalValue = process.env[ENV_KEY];

afterEach(() => {
  if (originalValue === undefined) {
    delete process.env[ENV_KEY];
  } else {
    process.env[ENV_KEY] = originalValue;
  }
});

describe("runtimeStaleThresholdMinutes", () => {
  test("defaults to 5 when unset", () => {
    delete process.env[ENV_KEY];
    expect(runtimeStaleThresholdMinutes()).toBe(5);
  });

  test("keeps a positive integer configuration", () => {
    process.env[ENV_KEY] = "12";
    expect(runtimeStaleThresholdMinutes()).toBe(12);
  });

  test("keeps positive fractional minutes", () => {
    for (const value of ["1.5", "0.25", " 2.5 "]) {
      process.env[ENV_KEY] = value;
      expect(runtimeStaleThresholdMinutes()).toBe(Number(value));
    }
  });

  test("a negative threshold falls back to 5 instead of expiring healthy runtimes", () => {
    // Number("-1") is truthy, so the old `Number(env) || 5` kept -1 and put the
    // liveness cutoff in the future (issue #2802).
    process.env[ENV_KEY] = "-1";
    expect(runtimeStaleThresholdMinutes()).toBe(5);

    const now = Date.now();
    const cutoff = now - runtimeStaleThresholdMinutes() * 60_000;
    expect(cutoff).toBeLessThan(now);
    const lastSeenAt = now - 1_000;
    expect(lastSeenAt >= cutoff).toBe(true);
  });

  test("zero, blank, and non-finite values fall back to 5", () => {
    for (const value of ["0", "-0.5", "NaN", "Infinity", "-Infinity", "abc", "", "   "]) {
      process.env[ENV_KEY] = value;
      expect(runtimeStaleThresholdMinutes()).toBe(5);
    }
  });
});
