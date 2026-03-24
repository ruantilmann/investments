import { FakeClock } from "./fakeClock.ts";

const testClock = new FakeClock(new Date());

export function getTestClock(): FakeClock {
  return testClock;
}

export function resetTestClock(date?: Date): FakeClock {
  testClock.set(date ?? new Date());
  return testClock;
}
