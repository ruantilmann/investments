import { Prisma } from '../../generated/prisma/client.ts';
import { prisma } from '../lib/prisma.ts';
import type { UserInput } from '../models/user.model.ts';

export class CreateUserService {
    async createUser(userInput: UserInput) {
        try {
            const user = await prisma.user.create({
                data: {
                    name: userInput.name,
                    email: userInput.email,
                },
            });
            return user;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new Error(`A user with the email ${userInput.email} already exists`);
            }
            throw error;
        }
    }
}

export class GetAllUsersService {
    async getAllUsers() {
        return prisma.user.findMany({
            orderBy: { id: 'asc' },
        });
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