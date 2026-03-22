import { prisma } from '../lib/prisma.ts';
import type { NewInvestmentInput } from '../models/investment.model.ts';

export class CreateInvestmentService {
  async execute({ owner, amount, date }: NewInvestmentInput) {
    const investment = await prisma.investment.create({
      data: {
        owner,
        amount,
        date: new Date(date),
      },
    });

    return investment;
  }
}