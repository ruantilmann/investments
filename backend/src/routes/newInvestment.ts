import type { FastifyInstance } from "fastify";

export async function newInvestmentRoute(server: FastifyInstance) {
  server.get('/newInvestment', async (req, res) => {
    res
    .code(200)
    .header('Content-Type', 'application/json; charset=utf-8')
    .send({ message: 'This is the new investment route!' });
  });
}
