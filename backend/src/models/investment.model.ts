import { z } from 'zod';

export const newInvestmentSchema = z.object({
  walletId: z.number().int().positive({ message: 'Wallet ID must be a positive integer' }),
  initialAmount: z.number().nonnegative({ message: 'Initial amount must be non-negative' }),
  investedAt: z.coerce.date({ message: "Invalid investedAt date" }),
});

export const listInvestmentsByUserQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['ACTIVE', 'WITHDRAWN', 'CANCELLED']).optional(),
});

export type InvestmentInput = z.infer<typeof newInvestmentSchema>;
export type ListInvestmentsByUserQueryInput = z.infer<typeof listInvestmentsByUserQuerySchema>;
