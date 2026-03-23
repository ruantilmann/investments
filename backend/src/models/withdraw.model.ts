import { z } from 'zod';

export const newWithdrawSchema = z.object({
  investmentId: z.number().int().positive({ message: 'Investment ID must be a positive integer' }),
  withdrawDate: z.coerce.date({ message: 'Invalid date format. Please use YYYY-MM-DD.' }),
  notes: z.string().trim().max(500).optional(),
});

export type WithdrawInput = z.infer<typeof newWithdrawSchema>;