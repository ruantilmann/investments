import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import {
  CreateUserService,
  GetAllUsersService,
  GetUserByEmail,
  GetUserById,
  GetUserByName,
} from "../services/userServices.ts";
import { listUsersQuerySchema, newUserSchema } from "../models/user.model.ts";

export async function userRoutes(server: FastifyInstance) {
  server.post("/newUser", async (req, res) => {
    try {
      const body = newUserSchema.parse(req.body);
      const createUserService = new CreateUserService();
      const user = await createUserService.createUser(body);

      return res.status(201).send(user);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(422).send({
          error: "Validation failed",
          details: error.flatten(),
        });
      }

      if (error instanceof Error && error.message === "USER_EMAIL_ALREADY_EXISTS") {
        return res.status(409).send({ error: "Email already exists" });
      }

      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(500).send({ error: errorMessage });
    }
  });

  server.get("/allUsers", async (req, res) => {
    try {
      const query = listUsersQuerySchema.parse(req.query);
      const getAllUsersService = new GetAllUsersService();
      const users = await getAllUsersService.getAllUsers(query);

      return res.status(200).send(users);
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

  server.get("/:id", async (req, res) => {
    try {
      const { id } = req.params as { id: string };
      const parsedId = Number(id);

      if (!Number.isInteger(parsedId) || parsedId <= 0) {
        return res.status(422).send({ error: "Invalid user id" });
      }

      const getUserByIdService = new GetUserById();
      const user = await getUserByIdService.execute(parsedId);

      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }

      return res.status(200).send(user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(500).send({ error: errorMessage });
    }
  });

  server.get("/search", async (req, res) => {
    try {
      const { name } = req.query as { name?: string };

      if (!name || !name.trim()) {
        return res.status(422).send({ error: "Name query is required" });
      }

      const getUserByNameService = new GetUserByName();
      const users = await getUserByNameService.execute(name.trim());

      return res.status(200).send(users);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(500).send({ error: errorMessage });
    }
  });

  server.get("/searchByEmail", async (req, res) => {
    try {
      const { email } = req.query as { email?: string };

      if (!email) {
        return res.status(422).send({ error: "Email query is required" });
      }

      const parsedEmail = newUserSchema.shape.email.safeParse(email);
      if (!parsedEmail.success) {
        return res.status(422).send({ error: "Invalid email format" });
      }

      const getUserByEmailService = new GetUserByEmail();
      const user = await getUserByEmailService.execute(parsedEmail.data);

      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }

      return res.status(200).send(user);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      return res.status(500).send({ error: errorMessage });
    }
  });
}
