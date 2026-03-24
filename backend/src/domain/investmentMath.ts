import { Prisma } from "../../generated/prisma/client.ts";

const MONTHLY_RATE = new Prisma.Decimal("0.0052");
const ONE_YEAR_IN_MONTHS = 12;
const TWO_YEARS_IN_MONTHS = 24;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function countCompletedMonths(investedAt: Date, referenceDate: Date): number {
  const start = startOfDay(investedAt);
  const end = startOfDay(referenceDate);

  if (end < start) {
    return 0;
  }

  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();

  let months = yearDiff * 12 + monthDiff;

  if (end.getDate() < start.getDate()) {
    months -= 1;
  }

  return Math.max(0, months);
}

export function calculateCompoundBalance(
  initialAmount: Prisma.Decimal,
  investedAt: Date,
  referenceDate: Date,
) {
  const monthsElapsed = countCompletedMonths(investedAt, referenceDate);

  let balance = new Prisma.Decimal(initialAmount);

  for (let index = 0; index < monthsElapsed; index += 1) {
    balance = balance.mul(new Prisma.Decimal(1).plus(MONTHLY_RATE));
  }

  const yieldAmount = balance.minus(initialAmount);

  return {
    monthsElapsed,
    yieldAmount: yieldAmount.toDecimalPlaces(2),
    expectedBalance: balance.toDecimalPlaces(2),
  };
}

export function getTaxRate(investedAt: Date, withdrawDate: Date): Prisma.Decimal {
  const monthsElapsed = countCompletedMonths(investedAt, withdrawDate);

  if (monthsElapsed < ONE_YEAR_IN_MONTHS) {
    return new Prisma.Decimal("0.225");
  }

  if (monthsElapsed < TWO_YEARS_IN_MONTHS) {
    return new Prisma.Decimal("0.185");
  }

  return new Prisma.Decimal("0.15");
}
