import { z } from 'zod';

export const newInvestmentSchema = z.object({
  walletId: z.number().int(),
  ownerName: z.string().optional(),
  title: z.string().optional(),
  initialAmount: z.number(),
  currentAmount: z.number(),
  yieldAmount: z.number().default(0),
  investedAt: z.date(),
  status: z.enum(['ACTIVE']).default('ACTIVE'),
  withdrawnAt: z.date().optional(),
});

export type investmentInput = z.infer<typeof newInvestmentSchema>;