import { z } from 'zod';

export const newInvestmentSchema = z.object({
  walletId: z.number().int().positive({ message: 'Wallet ID must be a positive integer' }),
  initialAmount: z.number().nonnegative({ message: 'Initial amount must be non-negative' }),
  investedAt: z.coerce.date({ message: "Invalid investedAt date" }),
});

export type InvestmentInput = z.infer<typeof newInvestmentSchema>;
