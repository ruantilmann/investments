import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "../../generated/prisma/client.ts";
import { prisma } from "../lib/prisma.ts";
import { calculateCompoundBalance } from "../domain/investmentMath.ts";
import {
  CreateInvestmentService,
  GetInvestmentSummaryByUserService,
  UpdateInvestmentStatusService,
} from "./investmentServices.ts";
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

test("GetInvestmentSummaryByUserService deve retornar zeros quando usuario nao possui investimentos", async () => {
  const tag = `svc-summary-empty-${Date.now()}`;
  const { user } = await createUserWithWallet(tag);

  try {
    const clock = new FakeClock(new Date("2026-03-01"));
    const summaryService = new GetInvestmentSummaryByUserService(clock);

    const summary = await summaryService.getByUserId(user.id);

    assert.equal(summary.userId, user.id);
    assert.equal(summary.totalInvested, "0.00");
    assert.equal(summary.totalActiveInvested, "0.00");
    assert.equal(summary.totalExpectedBalanceActive, "0.00");
    assert.equal(summary.totalWithdrawnGross, "0.00");
    assert.equal(summary.totalWithdrawnNet, "0.00");
    assert.equal(summary.totalTaxPaid, "0.00");
    assert.equal(summary.countInvestments, 0);
    assert.equal(summary.countActive, 0);
    assert.equal(summary.countWithdrawn, 0);
  } finally {
    await cleanupUser(user.id);
  }
});

test("GetInvestmentSummaryByUserService deve consolidar ativos e retirados", async () => {
  const tag = `svc-summary-mixed-${Date.now()}`;
  const { user, wallet } = await createUserWithWallet(tag);

  try {
    const clock = new FakeClock(new Date("2026-03-01"));
    const createInvestmentService = new CreateInvestmentService(clock);
    const withdrawService = new CreateWithdrawService(clock);
    const summaryService = new GetInvestmentSummaryByUserService(clock);

    const activeInvestment = await createInvestmentService.createInvestment({
      walletId: wallet.id,
      initialAmount: 500,
      investedAt: new Date("2025-10-01"),
    });

    const withdrawnInvestment = await createInvestmentService.createInvestment({
      walletId: wallet.id,
      initialAmount: 1000,
      investedAt: new Date("2025-01-15"),
    });

    const withdraw = await withdrawService.createWithdraw({
      investmentId: withdrawnInvestment.id,
      withdrawDate: new Date("2026-02-15"),
      notes: "summary test",
    });

    const summary = await summaryService.getByUserId(user.id);
    const expectedActive = calculateCompoundBalance(
      new Prisma.Decimal(activeInvestment.initialAmount),
      new Date("2025-10-01"),
      new Date("2026-03-01"),
    ).expectedBalance;

    assert.equal(summary.totalInvested, "1500.00");
    assert.equal(summary.totalActiveInvested, "500.00");
    assert.equal(summary.totalExpectedBalanceActive, expectedActive.toFixed(2));
    assert.equal(summary.totalWithdrawnGross, withdraw.grossAmount.toFixed(2));
    assert.equal(summary.totalWithdrawnNet, withdraw.netAmount.toFixed(2));
    assert.equal(summary.totalTaxPaid, withdraw.taxAmount.toFixed(2));
    assert.equal(summary.countInvestments, 2);
    assert.equal(summary.countActive, 1);
    assert.equal(summary.countWithdrawn, 1);
  } finally {
    await cleanupUser(user.id);
  }
});

test("UpdateInvestmentStatusService deve cancelar investimento ativo", async () => {
  const tag = `svc-cancel-active-${Date.now()}`;
  const { user, wallet } = await createUserWithWallet(tag);

  try {
    const clock = new FakeClock(new Date("2026-03-01"));
    const createInvestmentService = new CreateInvestmentService(clock);
    const updateInvestmentStatusService = new UpdateInvestmentStatusService();

    const investment = await createInvestmentService.createInvestment({
      walletId: wallet.id,
      initialAmount: 1000,
      investedAt: new Date("2025-01-15"),
    });

    const cancelled = await updateInvestmentStatusService.cancelInvestment(investment.id, {
      status: "CANCELLED",
      reason: "Cancelamento de teste",
    });

    assert.equal(cancelled.status, "CANCELLED");
    assert.equal(cancelled.withdrawnAt, null);
  } finally {
    await cleanupUser(user.id);
  }
});

test("UpdateInvestmentStatusService deve impedir cancelamento de investimento sacado", async () => {
  const tag = `svc-cancel-withdrawn-${Date.now()}`;
  const { user, wallet } = await createUserWithWallet(tag);

  try {
    const clock = new FakeClock(new Date("2026-03-01"));
    const createInvestmentService = new CreateInvestmentService(clock);
    const withdrawService = new CreateWithdrawService(clock);
    const updateInvestmentStatusService = new UpdateInvestmentStatusService();

    const investment = await createInvestmentService.createInvestment({
      walletId: wallet.id,
      initialAmount: 1000,
      investedAt: new Date("2025-01-15"),
    });

    await withdrawService.createWithdraw({
      investmentId: investment.id,
      withdrawDate: new Date("2026-02-15"),
      notes: "withdraw before cancel",
    });

    await assert.rejects(
      updateInvestmentStatusService.cancelInvestment(investment.id, {
        status: "CANCELLED",
        reason: "invalid cancel",
      }),
      /INVESTMENT_ALREADY_WITHDRAWN/,
    );
  } finally {
    await cleanupUser(user.id);
  }
});

test("UpdateInvestmentStatusService deve impedir segundo cancelamento", async () => {
  const tag = `svc-cancel-duplicate-${Date.now()}`;
  const { user, wallet } = await createUserWithWallet(tag);

  try {
    const clock = new FakeClock(new Date("2026-03-01"));
    const createInvestmentService = new CreateInvestmentService(clock);
    const updateInvestmentStatusService = new UpdateInvestmentStatusService();

    const investment = await createInvestmentService.createInvestment({
      walletId: wallet.id,
      initialAmount: 1000,
      investedAt: new Date("2025-01-15"),
    });

    await updateInvestmentStatusService.cancelInvestment(investment.id, {
      status: "CANCELLED",
      reason: "first cancel",
    });

    await assert.rejects(
      updateInvestmentStatusService.cancelInvestment(investment.id, {
        status: "CANCELLED",
        reason: "second cancel",
      }),
      /INVESTMENT_ALREADY_CANCELLED/,
    );
  } finally {
    await cleanupUser(user.id);
  }
});

test("UpdateInvestmentStatusService deve retornar erro para investimento inexistente", async () => {
  const updateInvestmentStatusService = new UpdateInvestmentStatusService();

  await assert.rejects(
    updateInvestmentStatusService.cancelInvestment(999999999, {
      status: "CANCELLED",
      reason: "not found",
    }),
    /INVESTMENT_NOT_FOUND/,
  );
});
