import { z } from 'zod';

export const newInvestmentSchema = z.object({
  owner: z.string().min(1, { message: 'Owner is required' }),
  amount: z.number().positive({ message: 'Amount must be a positive number' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format. Please use YYYY-MM-DD.' }),
});