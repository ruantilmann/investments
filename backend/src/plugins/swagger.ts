import type { FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

export async function swaggerPlugin(server: FastifyInstance) {
  await server.register(fastifySwagger, {
    openapi: {
      openapi: "3.0.3",
      info: {
        title: "Investments API",
        description: "API para gerenciamento de usuários, investimentos, saques e utilitários de teste.",
        version: "1.0.0",
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local development",
        },
      ],
      tags: [
        { name: "Users", description: "Operações de usuários" },
        { name: "Investments", description: "Operações de investimentos" },
        { name: "Withdraw", description: "Operações de saque" },
        { name: "Test Time", description: "Rotas de tempo para ambiente controlado" },
      ],
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: "/documentation",
    staticCSP: true,
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
  });
}
