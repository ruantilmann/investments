import fastify from 'fastify';
import { investmentRoutes } from './routes/investmentsRoutes.ts';
import { withdrawRoutes } from './routes/withdrawRoutes.ts';

const server = fastify({
  logger: true
});

server.get('/hello', async () => {
  return { message: 'Hello, World!' };
});

server.register(investmentRoutes, { prefix: '/api/investments' });
server.register(withdrawRoutes, { prefix: '/api/withdraw' });

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    server.log.error(err);
  }

  server.log.info(`Server listening at ${address}`);
});
