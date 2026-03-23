import { prisma } from '../lib/prisma.ts';
import type { withdrawInput } from '../models/withdraw.model.ts';

export class CreateWithdrawService {
    async createWithdraw({ owner, amount, date }: withdrawInput) {
        try {
            const withdraw = await prisma.withdraw.create({
                data: {
                    owner,
                    amount,
                    date: new Date(date),
                },
            });
            return withdraw;
        } catch (error) {
            throw new Error('Failed to create withdraw');
        }
    }
}