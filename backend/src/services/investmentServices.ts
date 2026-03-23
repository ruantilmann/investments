import { prisma } from '../lib/prisma.ts';
import type { investmentInput } from '../models/investment.model.ts';

export class CreateInvestmentService {
  async createInvestment({ owner, amount, date }: investmentInput) {
    try {
      const investment = await prisma.investment.create({
        data: {
          owner,
          amount,
          date: new Date(date),
        },
      });
      return investment;
    } catch (error) {
      throw new Error('Failed to create investment');
    }
  }
}

export class GetAllInvestmentsService {
  async getAllInvestments(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const investments = await prisma.investment.findMany({
      skip,
      take: limit,
    });
    return investments;
  }
  async getAllInvestmentsByOwner(owner: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.investment.findMany({
        where: { owner },
        skip,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      prisma.investment.count({
        where: { owner },
      })
    ]);
    return { 
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit), 
      },
     };
  }
}