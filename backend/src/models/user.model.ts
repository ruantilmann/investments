import { z } from 'zod';

export const newUserSchema = z.object({
    name: z.string().min(1, { message: 'Username is required' }),
    email: z.string().min(1, { message: 'Password is required' }),
});

export type userInput = z.infer<typeof newUserSchema>;