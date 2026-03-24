import { Prisma } from "../../generated/prisma/client.ts";
import { InvestmentStatus } from "../../generated/prisma/enums.ts";
import { prisma } from "../lib/prisma.ts";
import { calculateCompoundBalance, getTaxRate } from "../domain/investmentMath.ts";
import type { WithdrawInput } from "../models/withdraw.model.ts";

export class CreateWithdrawService {
  async createWithdraw(input: WithdrawInput) {
    const today = new Date();

    if (input.withdrawDate > today) {
      throw new Error("WITHDRAW_DATE_IN_FUTURE");
    }

    const createdWithdraw = await prisma.$transaction(async (tx) => {
      const investment = await tx.investment.findUnique({
        where: { id: input.investmentId },
        include: {
          withdraw: true,
        },
      });

      if (!investment) {
        throw new Error("INVESTMENT_NOT_FOUND");
      }

      if (investment.status === InvestmentStatus.WITHDRAWN || investment.withdraw) {
        throw new Error("INVESTMENT_ALREADY_WITHDRAWN");
      }

      if (input.withdrawDate < investment.investedAt) {
        throw new Error("WITHDRAW_BEFORE_INVESTMENT");
      }

      const calculated = calculateCompoundBalance(
        investment.initialAmount,
        investment.investedAt,
        input.withdrawDate,
      );

      const grossAmount = calculated.expectedBalance;
      const profitAmount = calculated.yieldAmount;
      const taxRate = getTaxRate(investment.investedAt, input.withdrawDate);
      const taxAmount = profitAmount.mul(taxRate).toDecimalPlaces(2);
      const netAmount = grossAmount.minus(taxAmount).toDecimalPlaces(2);

      const withdraw = await tx.withdraw.create({
        data: {
          investmentId: input.investmentId,
          grossAmount,
          taxAmount,
          netAmount,
          profitAmount,
          withdrawDate: input.withdrawDate,
          notes: input.notes ?? null,
        },
      });

      await tx.investment.update({
        where: { id: input.investmentId },
        data: {
          currentAmount: grossAmount,
          yieldAmount: profitAmount,
          status: InvestmentStatus.WITHDRAWN,
          withdrawnAt: input.withdrawDate,
        },
      });

      return {
        ...withdraw,
        taxRate,
      };
    });

    return createdWithdraw;
  }
}
