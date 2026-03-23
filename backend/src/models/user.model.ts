import { z } from 'zod';

export const newUserSchema = z.object({
    name: z.string().min(1, { message: 'Name is required' }),
    email: z.email({ message: 'Invalid email format' }),
});

export const listUsersQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    name: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
});

export type UserInput = z.infer<typeof newUserSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;