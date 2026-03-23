import { Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../lib/prisma.ts';
import type { UserInput, ListUsersQueryInput } from '../models/user.model.ts';

export class CreateUserService {
    async createUser(userInput: UserInput) {
        try {
            const createdUser = await prisma.$transaction(async (tx) => {
                const user = await tx.user.create({
                    data: {
                        name: userInput.name,
                        email: userInput.email,
                    },
                });
                
                await tx.wallet.create({
                    data: {
                        userId: user.id,
                        balance: new Prisma.Decimal(0),
                    },
                });

                return tx.user.findUnique({
                    where: { id: user.id },
                    include: { wallet: true },
                });
            });

            return createdUser;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new Error("USER_EMAIL_ALREADY_EXISTS");
            }

            throw error;
        }
    }
}

export class GetAllUsersService {
    async getAllUsers({ page, limit, name, email }: ListUsersQueryInput) {
        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            ...(name && { name: { contains: name } }),
            ...(email && { email: { contains: email } }),
        };

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { id: 'asc' },
            }),

            prisma.user.count({ where }),
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        }
    }
}

export class GetUserById {
    async execute(id: number) {
        return prisma.user.findUnique({
            where: { id },
        });
    }
}

export class GetUserByName {
    async execute(name: string) {
        return prisma.user.findMany({
            where: { name: { contains: name } },
            orderBy: { id: 'asc' },
        });
    }
}

export class GetUserByEmail {
    async execute(email: string) {
        return prisma.user.findUnique({
            where: { email },
        });
    }
}