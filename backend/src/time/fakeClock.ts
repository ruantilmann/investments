import type { Clock } from "./clock.ts";

export class FakeClock implements Clock {
  private currentDate: Date;

  constructor(initialDate: Date) {
    this.currentDate = new Date(initialDate);
  }

  now(): Date {
    return new Date(this.currentDate);
  }

  set(date: Date): void {
    this.currentDate = new Date(date);
  }

  advanceMonths(months: number): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + months,
      this.currentDate.getDate(),
      this.currentDate.getHours(),
      this.currentDate.getMinutes(),
      this.currentDate.getSeconds(),
      this.currentDate.getMilliseconds(),
    );
  }

  advanceDays(days: number): void {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth(),
      this.currentDate.getDate() + days,
      this.currentDate.getHours(),
      this.currentDate.getMinutes(),
      this.currentDate.getSeconds(),
      this.currentDate.getMilliseconds(),
    );
  }
}
