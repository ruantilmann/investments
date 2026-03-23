import { prisma } from '../lib/prisma.ts';
import type { userInput } from '../models/user.model.ts';

export class CreateUserService {
    async createUser(userInput: userInput) {
        const user = await prisma.user.create({
            data: {
                name: userInput.name,
                email: userInput.email,
            },
        });
        return user;
    }
}

export class GetAllUsersService {
    async getAllUsers() {
        const users = await prisma.user.findMany();
        return users;
    }
}

export class GetUserById {
    async execute(id: number) {
        const user = await prisma.user.findUnique({
            where: { id },
        });
        return user;
    }
}

export class GetUserByName {
    async execute(name: string) {
        const user = await prisma.user.findMany({
            where: { name },
        });
        return user;
    }
}

export class GetUserByEmail {
    async execute(email: string) {
        const user = await prisma.user.findUnique({
            where: { email },
        });
        return user;
    }
}