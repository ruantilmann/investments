import { z } from 'zod';

export const newWalletSchema = z.object({
  userId: z.number().int().positive({ message: 'User ID must be a positive integer' }),
  balance: z.number().nonnegative({ message: 'Balance must be non-negative' }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WalletInput = z.infer<typeof newWalletSchema>;