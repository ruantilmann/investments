import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { newWithdrawSchema } from "../models/withdraw.model";
import { CreateWithdrawService } from "../services/withdrawServices";
import { getAppClock } from "../time/clockProvider.ts";

const validationErrorSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    details: { type: "object", additionalProperties: true },
  },
};

const basicErrorSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
  },
};

const withdrawSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    investmentId: { type: "integer" },
    grossAmount: { type: "string" },
    taxAmount: { type: "string" },
    netAmount: { type: "string" },
    profitAmount: { type: "string" },
    withdrawDate: { type: "string", format: "date-time" },
    notes: { anyOf: [{ type: "string" }, { type: "null" }] },
    createdAt: { type: "string", format: "date-time" },
    taxRate: { type: "string" },
  },
};

export async function withdrawRoutes(server: FastifyInstance) {
  server.post("/newWithdraw", {
    schema: {
      tags: ["Withdraw"],
      summary: "Realizar saque total do investimento",
      body: {
        type: "object",
        required: ["investmentId", "withdrawDate"],
        properties: {
          investmentId: { type: "integer", minimum: 1 },
          withdrawDate: { type: "string", format: "date-time" },
          notes: { type: "string" },
        },
      },
      response: {
        201: withdrawSchema,
        404: basicErrorSchema,
        409: basicErrorSchema,
        422: validationErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
    try {
      const body = newWithdrawSchema.parse(req.body);
      const createWithdrawService = new CreateWithdrawService(getAppClock());
      const withdraw = await createWithdrawService.createWithdraw(body);

      return res.status(201).send(withdraw);
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
        return res.status(409).send({ error: "Investment already withdrawn" });
      }

      if (error instanceof Error && error.message === "WITHDRAW_BEFORE_INVESTMENT") {
        return res.status(422).send({ error: "Withdraw date cannot be before investedAt" });
      }

      if (error instanceof Error && error.message === "WITHDRAW_DATE_IN_FUTURE") {
        return res.status(422).send({ error: "Withdraw date cannot be in the future" });
      }

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(500).send({ error: errorMessage });
    }
  });
}
