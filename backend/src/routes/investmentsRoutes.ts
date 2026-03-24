import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import {
  investmentIdParamsSchema,
  listInvestmentsByUserQuerySchema,
  newInvestmentSchema,
  updateInvestmentStatusSchema,
  userIdParamsSchema,
} from "../models/investment.model";
import {
  CreateInvestmentService,
  GetInvestmentDetailsService,
  GetInvestmentSummaryByUserService,
  GetInvestmentsByUserService,
  UpdateInvestmentStatusService,
} from "../services/investmentServices";
import { getAppClock } from "../time/clockProvider.ts";

const basicErrorSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
};

const validationErrorSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    details: { type: "object", additionalProperties: true },
  },
};

const investmentSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    walletId: { type: "integer" },
    initialAmount: { type: "string" },
    currentAmount: { type: "string" },
    yieldAmount: { type: "string" },
    investedAt: { type: "string", format: "date-time" },
    status: { type: "string", enum: ["ACTIVE", "WITHDRAWN", "CANCELLED"] },
    withdrawnAt: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

export async function investmentRoutes(server: FastifyInstance) {
  server.post("/newInvestment", {
    schema: {
      tags: ["Investments"],
      summary: "Criar investimento",
      body: {
        type: "object",
        required: ["walletId", "initialAmount", "investedAt"],
        properties: {
          walletId: { type: "integer" },
          initialAmount: { type: "number", minimum: 0 },
          investedAt: { type: "string", format: "date-time" },
        },
      },
      response: {
        201: investmentSchema,
        404: basicErrorSchema,
        422: validationErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
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

  server.get("/user/:userId", {
    schema: {
      tags: ["Investments"],
      summary: "Listar investimentos por usuário",
      params: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: { type: "integer", minimum: 1 },
        },
      },
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100 },
          status: { type: "string", enum: ["ACTIVE", "WITHDRAWN", "CANCELLED"] },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: investmentSchema,
            },
            pagination: {
              type: "object",
              properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" },
              },
            },
          },
        },
        422: validationErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
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

  server.get("/user/:userId/summary", {
    schema: {
      tags: ["Investments"],
      summary: "Obter resumo financeiro de investimentos por usuário",
      params: {
        type: "object",
        required: ["userId"],
        properties: {
          userId: { type: "integer", minimum: 1 },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            userId: { type: "integer" },
            totalInvested: { type: "string" },
            totalActiveInvested: { type: "string" },
            totalExpectedBalanceActive: { type: "string" },
            totalWithdrawnGross: { type: "string" },
            totalWithdrawnNet: { type: "string" },
            totalTaxPaid: { type: "string" },
            countInvestments: { type: "integer" },
            countActive: { type: "integer" },
            countWithdrawn: { type: "integer" },
          },
        },
        422: validationErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
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

  server.patch("/:id/cancel-investment", {
    schema: {
      tags: ["Investments"],
      summary: "Cancelar investimento ativo",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "integer", minimum: 1 },
        },
      },
      body: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["CANCELLED"] },
          reason: { type: "string", minLength: 1, maxLength: 500 },
        },
      },
      response: {
        200: investmentSchema,
        404: basicErrorSchema,
        409: basicErrorSchema,
        422: validationErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
    try {
      const { id } = investmentIdParamsSchema.parse(req.params);
      const body = updateInvestmentStatusSchema.parse(req.body);

      const updateInvestmentStatusService = new UpdateInvestmentStatusService();
      const investment = await updateInvestmentStatusService.cancelInvestment(id, body);

      return res.status(200).send(investment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).send({
          error: "Validation failed",
          details: error.flatten(),
        });
      }

      if (error instanceof Error && error.message === "INVESTMENT_NOT_FOUND") {
        return res.status(404).send({ error: "Investment not found" });
      }

      if (error instanceof Error && error.message === "INVESTMENT_ALREADY_WITHDRAWN") {
        return res.status(409).send({ error: "Withdrawn investment cannot be cancelled" });
      }

      if (error instanceof Error && error.message === "INVESTMENT_ALREADY_CANCELLED") {
        return res.status(409).send({ error: "Investment already cancelled" });
      }

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(500).send({ error: errorMessage });
    }
  });

  server.get("/:investmentId", {
    schema: {
      tags: ["Investments"],
      summary: "Obter detalhes do investimento",
      params: {
        type: "object",
        required: ["investmentId"],
        properties: {
          investmentId: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            id: { type: "integer" },
            walletId: { type: "integer" },
            userId: { type: "integer" },
            initialAmount: { type: "string" },
            yieldAmount: { type: "string" },
            expectedBalance: { type: "string" },
            monthsElapsed: { type: "integer" },
            investedAt: { type: "string", format: "date-time" },
            status: { type: "string", enum: ["ACTIVE", "WITHDRAWN", "CANCELLED"] },
            withdrawnAt: { anyOf: [{ type: "string", format: "date-time" }, { type: "null" }] },
            withdraw: { anyOf: [{ type: "object", additionalProperties: true }, { type: "null" }] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        404: basicErrorSchema,
        422: basicErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
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
