import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { config } from './config';
import { authRoutes } from './core/routes/auth';
import { adminRoutes } from './core/routes/adminRoutes';
import { adminUsersRoutes } from './core/routes/adminUsers';
import { proxyRoutes } from './core/proxy';
import { loadPlugins } from './loader';
import fs from 'node:fs';
import path from 'node:path';

async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(cookie);

  // health
  app.get('/vibegate/api/health', async () => ({ status: 'ok' }));

  await authRoutes(app);
  await adminRoutes(app);
  await adminUsersRoutes(app);

  // Serve built web app statically under /vibegate (production scheme A)
  const webDistDir = path.resolve(process.cwd(), '..', 'web', 'dist');
  if (fs.existsSync(webDistDir)) {
    app.get('/vibegate/*', async (req, reply) => {
      const pathname = req.url.split('?')[0];
      // Let API and health be handled by API routes
      if (pathname.startsWith('/vibegate/api')) {
        // @ts-ignore
        return reply.callNotFound();
      }
      const mime = (file: string) => {
        const ext = path.extname(file).toLowerCase();
        switch (ext) {
          case '.html': return 'text/html; charset=utf-8';
          case '.js': return 'text/javascript; charset=utf-8';
          case '.css': return 'text/css; charset=utf-8';
          case '.svg': return 'image/svg+xml';
          case '.png': return 'image/png';
          case '.jpg':
          case '.jpeg': return 'image/jpeg';
          case '.ico': return 'image/x-icon';
          case '.json': return 'application/json; charset=utf-8';
          case '.txt': return 'text/plain; charset=utf-8';
          default: return 'application/octet-stream';
        }
      };
      let rel = pathname.replace(/^\/vibegate\/?/, '');
      if (!rel || rel.endsWith('/')) rel += 'index.html';
      const filePath = path.join(webDistDir, rel);
      const exists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();
      const finalFile = exists ? filePath : path.join(webDistDir, 'index.html');
      const type = mime(finalFile);
      if (path.extname(finalFile) === '.html') reply.header('Cache-Control', 'no-cache');
      else reply.header('Cache-Control', 'public, max-age=31536000, immutable');
      reply.header('Content-Type', type);
      const stream = fs.createReadStream(finalFile);
      return reply.send(stream);
    });
  }

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
