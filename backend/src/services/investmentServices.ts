import { Prisma } from "../../generated/prisma/client.ts";
import { InvestmentStatus } from "../../generated/prisma/enums.ts";
import { prisma } from "../lib/prisma.ts";
import { calculateCompoundBalance } from "../domain/investmentMath.ts";
import type { Clock } from "../time/clock.ts";
import { SystemClock } from "../time/systemClock.ts";
import type {
  InvestmentInput,
  ListInvestmentsByUserQueryInput,
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
