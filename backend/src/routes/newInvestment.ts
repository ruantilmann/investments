import type { FastifyInstance } from "fastify";
import { CreateInvestmentService } from "../services/createInvestmentService.ts";
import { newInvestmentSchema } from "../models/investment.model.ts";

export async function newInvestmentRoute(server: FastifyInstance) {
  server.post('/newInvestment', async (req, res) => {
    try {
      const body = newInvestmentSchema.parse(req.body);
      
      const createInvestmentService = new CreateInvestmentService();
      const investment = await createInvestmentService.execute(body);
      
      res.status(201).send(investment);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(400).send({ error: errorMessage });
    }
  });
}
