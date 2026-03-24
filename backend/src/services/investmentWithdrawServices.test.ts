import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../lib/prisma.ts";
import { CreateInvestmentService } from "./investmentServices.ts";
import { CreateWithdrawService } from "./withdrawServices.ts";
import { FakeClock } from "../time/fakeClock.ts";

async function createUserWithWallet(tag: string) {
  const user = await prisma.user.create({
    data: {
      name: `Test ${tag}`,
      email: `${tag}@example.com`,
    },
  });

  const wallet = await prisma.wallet.create({
    data: {
      userId: user.id,
      balance: new Prisma.Decimal("0"),
    },
  });

  return { user, wallet };
}

async function cleanupUser(userId: number) {
  await prisma.user.delete({ where: { id: userId } });
}

test("CreateInvestmentService deve rejeitar data de investimento futura", async () => {
  const tag = `svc-invest-future-${Date.now()}`;
  const { user, wallet } = await createUserWithWallet(tag);

  try {
    const clock = new FakeClock(new Date("2026-01-01"));
    const service = new CreateInvestmentService(clock);

    await assert.rejects(
      service.createInvestment({
        walletId: wallet.id,
        initialAmount: 1000,
        investedAt: new Date("2026-01-02"),
      }),
      /INVESTMENT_DATE_IN_FUTURE/,
    );
  } finally {
    await cleanupUser(user.id);
  }
});

test("CreateWithdrawService deve rejeitar saque com data futura", async () => {
  const tag = `svc-withdraw-future-${Date.now()}`;
  const { user, wallet } = await createUserWithWallet(tag);

  try {
    const clock = new FakeClock(new Date("2026-01-10"));
    const createInvestmentService = new CreateInvestmentService(clock);
    const withdrawService = new CreateWithdrawService(clock);

    const investment = await createInvestmentService.createInvestment({
      walletId: wallet.id,
      initialAmount: 1000,
      investedAt: new Date("2025-12-10"),
    });

    await assert.rejects(
      withdrawService.createWithdraw({
        investmentId: investment.id,
        withdrawDate: new Date("2026-01-11"),
        notes: "future test",
      }),
      /WITHDRAW_DATE_IN_FUTURE/,
    );
  } finally {
    await cleanupUser(user.id);
  }
});

test("CreateWithdrawService deve calcular imposto e atualizar investimento", async () => {
  const tag = `svc-withdraw-tax-${Date.now()}`;
  const { user, wallet } = await createUserWithWallet(tag);

  try {
    const clock = new FakeClock(new Date("2026-03-01"));
    const createInvestmentService = new CreateInvestmentService(clock);
    const withdrawService = new CreateWithdrawService(clock);

    const investment = await createInvestmentService.createInvestment({
      walletId: wallet.id,
      initialAmount: 1000,
      investedAt: new Date("2025-01-15"),
    });

    const withdraw = await withdrawService.createWithdraw({
      investmentId: investment.id,
      withdrawDate: new Date("2026-02-15"),
      notes: "tax test",
    });

    assert.equal(withdraw.taxRate.equals(new Prisma.Decimal("0.185")), true);
    assert.equal(withdraw.grossAmount.greaterThan(1000), true);
    assert.equal(withdraw.netAmount.lessThan(withdraw.grossAmount), true);

    const updatedInvestment = await prisma.investment.findUnique({
      where: { id: investment.id },
    });

    assert.equal(updatedInvestment?.status, "WITHDRAWN");
    assert.equal(updatedInvestment?.withdrawnAt?.toISOString(), new Date("2026-02-15").toISOString());
  } finally {
    await cleanupUser(user.id);
  }
});

test("CreateWithdrawService deve impedir segundo saque no mesmo investimento", async () => {
  const tag = `svc-withdraw-dup-${Date.now()}`;
  const { user, wallet } = await createUserWithWallet(tag);

  try {
    const clock = new FakeClock(new Date("2026-03-01"));
    const createInvestmentService = new CreateInvestmentService(clock);
    const withdrawService = new CreateWithdrawService(clock);

    const investment = await createInvestmentService.createInvestment({
      walletId: wallet.id,
      initialAmount: 1000,
      investedAt: new Date("2025-01-15"),
    });

    await withdrawService.createWithdraw({
      investmentId: investment.id,
      withdrawDate: new Date("2026-02-15"),
      notes: "first withdraw",
    });

    await assert.rejects(
      withdrawService.createWithdraw({
        investmentId: investment.id,
        withdrawDate: new Date("2026-02-20"),
        notes: "second withdraw",
      }),
      /INVESTMENT_ALREADY_WITHDRAWN/,
    );
  } finally {
    await cleanupUser(user.id);
  }
});
