import { Prisma } from "../../generated/prisma/client.ts";
import { InvestmentStatus } from "../../generated/prisma/enums.ts";
import { prisma } from "../lib/prisma.ts";
import { calculateCompoundBalance } from "../domain/investmentMath.ts";
import type { Clock } from "../time/clock.ts";
import { SystemClock } from "../time/systemClock.ts";
import type {
  InvestmentInput,
  InvestmentSummaryResponse,
  ListInvestmentsByUserQueryInput,
  UpdateInvestmentStatusInput,
} from "../models/investment.model.ts";

export class CreateInvestmentService {
  constructor(private readonly clock: Clock = new SystemClock()) {}

  async createInvestment(input: InvestmentInput) {
    const today = this.clock.now();

    if (input.investedAt > today) {
      throw new Error("INVESTMENT_DATE_IN_FUTURE");
    }

    const wallet = await prisma.wallet.findUnique({
      where: { id: input.walletId },
    });

    if (!wallet) {
      throw new Error("WALLET_NOT_FOUND");
    }

    const initialAmount = new Prisma.Decimal(input.initialAmount);

    const investment = await prisma.investment.create({
      data: {
        walletId: input.walletId,
        initialAmount,
        currentAmount: initialAmount,
        yieldAmount: new Prisma.Decimal(0),
        investedAt: input.investedAt,
        status: InvestmentStatus.ACTIVE,
      },
    });

    return investment;
  }
}

export class GetInvestmentDetailsService {
  constructor(private readonly clock: Clock = new SystemClock()) {}

  async getById(investmentId: number) {
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
      include: {
        wallet: {
          select: {
            id: true,
            userId: true,
          },
        },
        withdraw: true,
      },
    });

    if (!investment) {
      throw new Error("INVESTMENT_NOT_FOUND");
    }

    const referenceDate = investment.withdrawnAt ?? this.clock.now();
    const calculated = calculateCompoundBalance(
      investment.initialAmount,
      investment.investedAt,
      referenceDate,
    );

    const yieldAmount = investment.withdraw
      ? investment.withdraw.profitAmount
      : calculated.yieldAmount;
    const expectedBalance = investment.withdraw
      ? investment.withdraw.grossAmount
      : calculated.expectedBalance;

    return {
      id: investment.id,
      walletId: investment.walletId,
      userId: investment.wallet.userId,
      initialAmount: investment.initialAmount,
      yieldAmount,
      expectedBalance,
      monthsElapsed: calculated.monthsElapsed,
      investedAt: investment.investedAt,
      status: investment.status,
      withdrawnAt: investment.withdrawnAt,
      withdraw: investment.withdraw,
      createdAt: investment.createdAt,
      updatedAt: investment.updatedAt,
    };
  }
}

export class GetInvestmentsByUserService {
  async getByUserId(userId: number, query: ListInvestmentsByUserQueryInput) {
    const { page, limit, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InvestmentWhereInput = {
      wallet: { userId },
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.investment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ investedAt: "desc" }, { id: "desc" }],
      }),
      prisma.investment.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export class GetInvestmentSummaryByUserService {
  constructor(private readonly clock: Clock = new SystemClock()) {}

  async getByUserId(userId: number): Promise<InvestmentSummaryResponse> {
    const investmentWhere: Prisma.InvestmentWhereInput = {
      wallet: { userId },
    };

    const [
      totalInvestedAggregate,
      totalActiveAggregate,
      totalWithdrawnAggregate,
      countInvestments,
      countActive,
      countWithdrawn,
      activeInvestments,
    ] = await Promise.all([
      prisma.investment.aggregate({
        where: investmentWhere,
        _sum: { initialAmount: true },
      }),
      prisma.investment.aggregate({
        where: {
          ...investmentWhere,
          status: InvestmentStatus.ACTIVE,
        },
        _sum: { initialAmount: true },
      }),
      prisma.withdraw.aggregate({
        where: {
          investment: {
            wallet: { userId },
          },
        },
        _sum: {
          grossAmount: true,
          netAmount: true,
          taxAmount: true,
        },
      }),
      prisma.investment.count({ where: investmentWhere }),
      prisma.investment.count({
        where: {
          ...investmentWhere,
          status: InvestmentStatus.ACTIVE,
        },
      }),
      prisma.investment.count({
        where: {
          ...investmentWhere,
          status: InvestmentStatus.WITHDRAWN,
        },
      }),
      prisma.investment.findMany({
        where: {
          ...investmentWhere,
          status: InvestmentStatus.ACTIVE,
        },
        select: {
          initialAmount: true,
          investedAt: true,
        },
      }),
    ]);

    const now = this.clock.now();
    const totalExpectedBalanceActive = activeInvestments.reduce(
      (acc, investment) =>
        acc.plus(calculateCompoundBalance(investment.initialAmount, investment.investedAt, now).expectedBalance),
      new Prisma.Decimal(0),
    );

    return {
      userId,
      totalInvested: (totalInvestedAggregate._sum.initialAmount ?? new Prisma.Decimal(0)).toFixed(2),
      totalActiveInvested: (totalActiveAggregate._sum.initialAmount ?? new Prisma.Decimal(0)).toFixed(2),
      totalExpectedBalanceActive: totalExpectedBalanceActive.toFixed(2),
      totalWithdrawnGross: (totalWithdrawnAggregate._sum.grossAmount ?? new Prisma.Decimal(0)).toFixed(2),
      totalWithdrawnNet: (totalWithdrawnAggregate._sum.netAmount ?? new Prisma.Decimal(0)).toFixed(2),
      totalTaxPaid: (totalWithdrawnAggregate._sum.taxAmount ?? new Prisma.Decimal(0)).toFixed(2),
      countInvestments,
      countActive,
      countWithdrawn,
    };
  }
}

export class UpdateInvestmentStatusService {
  async cancelInvestment(investmentId: number, _input: UpdateInvestmentStatusInput) {
    const investment = await prisma.investment.findUnique({
      where: { id: investmentId },
    });

    if (!investment) {
      throw new Error("INVESTMENT_NOT_FOUND");
    }

    if (investment.status === InvestmentStatus.WITHDRAWN) {
      throw new Error("INVESTMENT_ALREADY_WITHDRAWN");
    }

    if (investment.status === InvestmentStatus.CANCELLED) {
      throw new Error("INVESTMENT_ALREADY_CANCELLED");
    }

    return prisma.investment.update({
      where: { id: investmentId },
      data: {
        status: InvestmentStatus.CANCELLED,
      },
    });
  }
}
