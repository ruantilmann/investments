import fastify from 'fastify';
import { newInvestmentRoute } from './routes/newInvestment.ts';

const server = fastify({
  logger: true
});

server.get('/hello', async (request, reply) => {
  return { message: 'Hello, World!' };
});

server.register(newInvestmentRoute, { prefix: '/investments' });

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    server.log.error(err);
  }

  server.log.info(`Server listening at ${address}`);
});
