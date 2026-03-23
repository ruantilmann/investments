import fastify from 'fastify';
import { investmentRoutes } from './routes/investmentsRoutes.ts';

const server = fastify({
  logger: true
});

server.get('/hello', async () => {
  return { message: 'Hello, World!' };
});

server.register(investmentRoutes, { prefix: '/api' });

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    server.log.error(err);
  }

  server.log.info(`Server listening at ${address}`);
});
