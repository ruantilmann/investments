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

const userSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    email: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const walletSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    userId: { type: "integer" },
    balance: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

const userWithWalletSchema = {
  type: "object",
  properties: {
    ...userSchema.properties,
    wallet: {
      anyOf: [walletSchema, { type: "null" }],
    },
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

export async function userRoutes(server: FastifyInstance) {
  server.post("/newUser", {
    schema: {
      tags: ["Users"],
      summary: "Criar usuário",
      body: {
        type: "object",
        required: ["name", "email"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      response: {
        201: userWithWalletSchema,
        409: basicErrorSchema,
        422: validationErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
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

  server.get("/allUsers", {
    schema: {
      tags: ["Users"],
      summary: "Listar usuários com paginação",
      querystring: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1 },
          limit: { type: "integer", minimum: 1, maximum: 100 },
          name: { type: "string" },
          email: { type: "string", format: "email" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: userSchema,
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

  server.get("/:id", {
    schema: {
      tags: ["Users"],
      summary: "Buscar usuário por id",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      },
      response: {
        200: userSchema,
        404: basicErrorSchema,
        422: basicErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
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

  server.get("/search", {
    schema: {
      tags: ["Users"],
      summary: "Buscar usuários por nome",
      querystring: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
      response: {
        200: {
          type: "array",
          items: userSchema,
        },
        422: basicErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
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

  server.get("/searchByEmail", {
    schema: {
      tags: ["Users"],
      summary: "Buscar usuário por email",
      querystring: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      response: {
        200: userSchema,
        404: basicErrorSchema,
        422: basicErrorSchema,
        500: basicErrorSchema,
      },
    },
  }, async (req, res) => {
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
