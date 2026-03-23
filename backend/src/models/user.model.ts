import { z } from 'zod';

export const newUserSchema = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z.email({ message: 'Invalid email format' }),
});

export type UserInput = z.infer<typeof newUserSchema>;