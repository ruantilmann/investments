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

export const userIdParamsSchema = z.object({
  userId: z.coerce.number().int().positive({ message: 'User ID must be a positive integer' }),
});

export type InvestmentInput = z.infer<typeof newInvestmentSchema>;
export type ListInvestmentsByUserQueryInput = z.infer<typeof listInvestmentsByUserQuerySchema>;
export type UserIdParamsInput = z.infer<typeof userIdParamsSchema>;

export type InvestmentSummaryResponse = {
  userId: number;
  totalInvested: string;
  totalActiveInvested: string;
  totalExpectedBalanceActive: string;
  totalWithdrawnGross: string;
  totalWithdrawnNet: string;
  totalTaxPaid: string;
  countInvestments: number;
  countActive: number;
  countWithdrawn: number;
};
