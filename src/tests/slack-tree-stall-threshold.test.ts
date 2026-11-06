import { afterEach, describe, expect, test } from 'bun:test';

import { slackTreeStallMinutes } from '../slack/render-v2.ts';

const ENV_KEY = 'SLACK_TREE_STALL_MIN';

afterEach(() => {
  delete process.env[ENV_KEY];
});

describe('slackTreeStallMinutes', () => {
  test('defaults to 15 when unset', () => {
    delete process.env[ENV_KEY];
    expect(slackTreeStallMinutes()).toBe(15);
  });

  test('keeps a positive integer configuration', () => {
    process.env[ENV_KEY] = '20';
    expect(slackTreeStallMinutes()).toBe(20);
  });

  test('a negative threshold falls back to 15 instead of marking active tasks stalled', () => {
    // Number("-1") is truthy, so the old `Number(env) || 15` kept -1 and made
    // idleMin >= threshold true for every in-progress task (issue #2801).
    process.env[ENV_KEY] = '-1';
    expect(slackTreeStallMinutes()).toBe(15);
    const idleMin = 0;
    expect(idleMin >= slackTreeStallMinutes()).toBe(false);
  });

  test('zero, non-integer, and non-finite values fall back to 15', () => {
    for (const value of ['0', '2.5', 'NaN', 'abc', '']) {
      process.env[ENV_KEY] = value;
      expect(slackTreeStallMinutes()).toBe(15);
    }
  });
});
