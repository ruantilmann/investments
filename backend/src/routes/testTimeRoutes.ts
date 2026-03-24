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

export async function testTimeRoutes(server: FastifyInstance) {
  server.get("/time", async (_req, res) => {
    return res.status(200).send({ now: getTestClock().now().toISOString() });
  });

  server.post("/time/set", async (req, res) => {
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

  server.post("/time/advance-months", async (req, res) => {
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

  server.post("/time/advance-days", async (req, res) => {
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

  server.post("/time/reset", async (_req, res) => {
    const clock = resetTestClock();

    return res.status(200).send({ now: clock.now().toISOString() });
  });
}
