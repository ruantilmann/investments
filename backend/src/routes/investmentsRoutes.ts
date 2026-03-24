import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import {
  listInvestmentsByUserQuerySchema,
  newInvestmentSchema,
  userIdParamsSchema,
} from "../models/investment.model";
import {
  CreateInvestmentService,
  GetInvestmentDetailsService,
  GetInvestmentSummaryByUserService,
  GetInvestmentsByUserService,
} from "../services/investmentServices";
import { getAppClock } from "../time/clockProvider.ts";

export async function investmentRoutes(server: FastifyInstance) {
  server.post("/newInvestment", async (req, res) => {
    try {
      const body = newInvestmentSchema.parse(req.body);

      const createInvestmentService = new CreateInvestmentService(getAppClock());
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

  server.get("/user/:userId", async (req, res) => {
    try {
      const { userId } = userIdParamsSchema.parse(req.params);

      const query = listInvestmentsByUserQuerySchema.parse(req.query);

      const getInvestmentsByUserService = new GetInvestmentsByUserService();
      const response = await getInvestmentsByUserService.getByUserId(userId, query);

      return res.status(200).send(response);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).send({
          error: "Validation failed",
          details: error.flatten(),
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(500).send({ error: errorMessage });
    }
  });

  server.get("/user/:userId/summary", async (req, res) => {
    try {
      const { userId } = userIdParamsSchema.parse(req.params);

      const getInvestmentSummaryByUserService = new GetInvestmentSummaryByUserService(getAppClock());
      const response = await getInvestmentSummaryByUserService.getByUserId(userId);

      return res.status(200).send(response);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).send({
          error: "Validation failed",
          details: error.flatten(),
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(500).send({ error: errorMessage });
    }
  });

  server.get("/:investmentId", async (req, res) => {
    try {
      const { investmentId } = req.params as { investmentId: string };
      const parsedInvestmentId = Number(investmentId);

      if (!Number.isInteger(parsedInvestmentId) || parsedInvestmentId <= 0) {
        return res.status(422).send({ error: "Invalid investment id" });
      }

      const getInvestmentDetailsService = new GetInvestmentDetailsService(getAppClock());
      const investment = await getInvestmentDetailsService.getById(parsedInvestmentId);

      return res.status(200).send(investment);
    } catch (error) {
      if (error instanceof Error && error.message === "INVESTMENT_NOT_FOUND") {
        return res.status(404).send({ error: "Investment not found" });
      }

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(500).send({ error: errorMessage });
    }
  });
}
