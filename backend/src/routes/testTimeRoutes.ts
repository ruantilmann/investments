import type { FastifyInstance } from "fastify";
import { z, ZodError } from "zod";
import { getTestClock, resetTestClock } from "../time/testClock.ts";

const setTimeSchema = z.object({
  date: z.coerce.date({ message: "Invalid date" }),
});

const advanceMonthsSchema = z.object({
  months: z.coerce.number().int().positive({ message: "Months must be positive" }),
});

const advanceDaysSchema = z.object({
  days: z.coerce.number().int().positive({ message: "Days must be positive" }),
});

const timeResponseSchema = {
  type: "object",
  properties: {
    now: { type: "string", format: "date-time" },
  },
};

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

export async function testTimeRoutes(server: FastifyInstance) {
  server.get("/time", {
    schema: {
      tags: ["Test Time"],
      summary: "Obter data atual do relógio de teste",
      description: "Disponível apenas em ambiente controlado.",
      response: {
        200: timeResponseSchema,
      },
    },
  }, async (_req, res) => {
    return res.status(200).send({ now: getTestClock().now().toISOString() });
  });

  server.post("/time/set", {
    schema: {
      tags: ["Test Time"],
      summary: "Definir data absoluta do relógio de teste",
      description: "Disponível apenas em ambiente controlado.",
      body: {
        type: "object",
        required: ["date"],
        properties: {
          date: { type: "string", format: "date-time" },
        },
      },
      response: {
        200: timeResponseSchema,
        422: validationErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
    try {
      const body = setTimeSchema.parse(req.body);
      const clock = resetTestClock(body.date);

      return res.status(200).send({ now: clock.now().toISOString() });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).send({
          error: "Validation failed",
          details: error.flatten(),
        });
      }

      return res.status(500).send({ error: "An unknown error occurred" });
    }
  });

  server.post("/time/advance-months", {
    schema: {
      tags: ["Test Time"],
      summary: "Avançar relógio de teste em meses",
      description: "Disponível apenas em ambiente controlado.",
      body: {
        type: "object",
        required: ["months"],
        properties: {
          months: { type: "integer", minimum: 1 },
        },
      },
      response: {
        200: timeResponseSchema,
        422: validationErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
    try {
      const body = advanceMonthsSchema.parse(req.body);
      const clock = getTestClock();
      clock.advanceMonths(body.months);

      return res.status(200).send({ now: clock.now().toISOString() });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).send({
          error: "Validation failed",
          details: error.flatten(),
        });
      }

      return res.status(500).send({ error: "An unknown error occurred" });
    }
  });

  server.post("/time/advance-days", {
    schema: {
      tags: ["Test Time"],
      summary: "Avançar relógio de teste em dias",
      description: "Disponível apenas em ambiente controlado.",
      body: {
        type: "object",
        required: ["days"],
        properties: {
          days: { type: "integer", minimum: 1 },
        },
      },
      response: {
        200: timeResponseSchema,
        422: validationErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
    try {
      const body = advanceDaysSchema.parse(req.body);
      const clock = getTestClock();
      clock.advanceDays(body.days);

      return res.status(200).send({ now: clock.now().toISOString() });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).send({
          error: "Validation failed",
          details: error.flatten(),
        });
      }

      return res.status(500).send({ error: "An unknown error occurred" });
    }
  });

  server.post("/time/reset", {
    schema: {
      tags: ["Test Time"],
      summary: "Resetar relógio de teste para data atual",
      description: "Disponível apenas em ambiente controlado.",
      response: {
        200: timeResponseSchema,
      },
    },
  }, async (_req, res) => {
    const clock = resetTestClock();

    return res.status(200).send({ now: clock.now().toISOString() });
  });
}
