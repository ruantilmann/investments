import type { FastifyInstance } from "fastify";
import { newWithdrawSchema } from "../models/withdraw.model.ts";
import { CreateWithdrawService } from "../services/withdrawServices.ts";

export async function withdrawRoutes(server: FastifyInstance) {
    server.post('/newWithdraw', async (req, res) => {
      try {
        const body = newWithdrawSchema.parse(req.body);
        
        const createWithdrawService = new CreateWithdrawService();
        const withdraw = await createWithdrawService.createWithdraw(body);
        
        res.status(201).send(withdraw);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        res.status(400).send({ error: errorMessage });
      }
    });
}