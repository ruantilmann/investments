import { Prisma } from "../../generated/prisma/client.ts";
import { InvestmentStatus } from "../../generated/prisma/enums.ts";
import { prisma } from "../lib/prisma.ts";
import type {
  InvestmentInput,
  ListInvestmentsByUserQueryInput,
} from "../models/investment.model.ts";

export class CreateInvestmentService {
  async createInvestment(input: InvestmentInput) {
    const today = new Date();

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
