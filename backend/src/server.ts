import fastify from 'fastify';
import { userRoutes } from './routes/userRoutes';
import { investmentRoutes } from './routes/investmentsRoutes';
import { withdrawRoutes } from './routes/withdrawRoutes';
import { testTimeRoutes } from './routes/testTimeRoutes';
import { swaggerPlugin } from './plugins/swagger.ts';
import { isTestTimeApiEnabled } from './time/clockProvider.ts';

const server = fastify({
  logger: true
});

server.get('/hello', async () => {
  return { message: 'Hello, World!' };
});

server.register(swaggerPlugin);

server.register(userRoutes, { prefix: '/api/users' });
server.register(investmentRoutes, { prefix: '/api/investments' });
server.register(withdrawRoutes, { prefix: '/api/withdraw' });

if (isTestTimeApiEnabled()) {
  server.log.warn('Test time API enabled. Use only in local testing environments.');
  server.register(testTimeRoutes, { prefix: '/api/test' });
}

server.listen({ port: 3000 }, (err, address) => {
  if (err) {
    server.log.error(err);
  }

  server.log.info(`Server listening at ${address}`);
});
