import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "../../generated/prisma/client.ts";
import {
  calculateCompoundBalance,
  countCompletedMonths,
  getTaxRate,
} from "./investmentMath.ts";

test("countCompletedMonths deve retornar zero para menos de um mês completo", () => {
  const investedAt = new Date("2026-01-15");
  const referenceDate = new Date("2026-02-14");

  const months = countCompletedMonths(investedAt, referenceDate);

  assert.equal(months, 0);
});

test("countCompletedMonths deve contar um mês completo no mesmo dia", () => {
  const investedAt = new Date("2026-01-15");
  const referenceDate = new Date("2026-02-15");

  const months = countCompletedMonths(investedAt, referenceDate);

  assert.equal(months, 1);
});

test("calculateCompoundBalance deve calcular um mês com 0.52%", () => {
  const initialAmount = new Prisma.Decimal("1000");
  const investedAt = new Date("2026-01-15");
  const referenceDate = new Date("2026-02-15");

  const result = calculateCompoundBalance(initialAmount, investedAt, referenceDate);

  assert.equal(result.monthsElapsed, 1);
  assert.equal(result.yieldAmount.equals(new Prisma.Decimal("5.20")), true);
  assert.equal(result.expectedBalance.equals(new Prisma.Decimal("1005.20")), true);
});

test("getTaxRate deve aplicar 22.5% para menos de um ano", () => {
  const investedAt = new Date("2026-01-15");
  const withdrawDate = new Date("2026-12-14");

  const taxRate = getTaxRate(investedAt, withdrawDate);

  assert.equal(taxRate.toString(), "0.225");
});

test("getTaxRate deve aplicar 18.5% entre um e dois anos", () => {
  const investedAt = new Date("2024-01-15");
  const withdrawDate = new Date("2025-02-15");

  const taxRate = getTaxRate(investedAt, withdrawDate);

  assert.equal(taxRate.toString(), "0.185");
});

test("getTaxRate deve aplicar 15% para mais de dois anos", () => {
  const investedAt = new Date("2023-01-15");
  const withdrawDate = new Date("2025-02-16");

  const taxRate = getTaxRate(investedAt, withdrawDate);

  assert.equal(taxRate.toString(), "0.15");
});
