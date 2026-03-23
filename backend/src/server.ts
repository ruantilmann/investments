import fastify from 'fastify';
import { userRoutes } from './routes/userRoutes';
import { investmentRoutes } from './routes/investmentsRoutes';

const server = fastify({
  logger: true
});

server.get('/hello', async () => {
  return { message: 'Hello, World!' };
});

server.register(userRoutes, { prefix: '/api/users' });
server.register(investmentRoutes, { prefix: '/api/investments' });

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    server.log.error(err);
  }

  server.log.info(`Server listening at ${address}`);
});
