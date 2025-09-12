import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { config } from './config';
import { authRoutes } from './core/routes/auth';
import { adminRoutes } from './core/routes/adminRoutes';
import { adminUsersRoutes } from './core/routes/adminUsers';
import { proxyRoutes } from './core/proxy';
import { loadPlugins } from './loader';

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cookie);

  // health
  app.get('/vibegate/health', async () => ({ status: 'ok' }));

  await authRoutes(app);
  await adminRoutes(app);
  await adminUsersRoutes(app);

  // load internal plugins before proxy
  await loadPlugins(app);

  // register proxy last to catch-all
  await proxyRoutes(app);

  return app;
}

buildServer()
  .then(app => app.listen({ port: config.port, host: config.host }))
  .then(() => console.log(`Gateway listening on http://${config.host}:${config.port}`))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
