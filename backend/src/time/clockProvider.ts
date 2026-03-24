import type { Clock } from "./clock.ts";
import { SystemClock } from "./systemClock.ts";
import { getTestClock } from "./testClock.ts";

const TEST_MODE = "test";

export function isTestTimeApiEnabled(): boolean {
  return process.env.NODE_ENV === TEST_MODE || process.env.ENABLE_TEST_TIME_API === "true";
}

export function getAppClock(): Clock {
  if (isTestTimeApiEnabled()) {
    return getTestClock();
  }

  return new SystemClock();
}
