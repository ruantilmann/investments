import { z } from 'zod';

export const newInvestmentSchema = z.object({
  walletId: z.number().int().positive(),
  ownerName: z.string().trim().min(1, { message: 'Owner name is required' }),
  initialAmount: z.number().nonnegative({ message: 'Amount must be a positive number' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format. Please use YYYY-MM-DD.' }),
});

export type InvestmentInput = z.infer<typeof newInvestmentSchema>;