import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { newInvestmentSchema } from "../models/investment.model";
import { CreateInvestmentService } from "../services/investmentServices";

export async function investmentRoutes(server: FastifyInstance) {
  server.post("/newInvestment", async (req, res) => {
    try {
      const body = newInvestmentSchema.parse(req.body);

      const createInvestmentService = new CreateInvestmentService();
      const investment = await createInvestmentService.createInvestment(body);

      return res.status(201).send(investment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).send({
          error: "Validation failed",
          details: error.flatten(),
        });
      }

      if (error instanceof Error && error.message === "WALLET_NOT_FOUND") {
        return res.status(404).send({ error: "Wallet not found" });
      }

      if (error instanceof Error && error.message === "INVESTMENT_DATE_IN_FUTURE") {
        return res.status(422).send({ error: "Invested date cannot be in the future" });
      }

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(500).send({ error: errorMessage });
    }
  });
}
