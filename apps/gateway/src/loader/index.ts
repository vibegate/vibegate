import type { FastifyInstance, onSendAsyncHookHandler } from 'fastify';
import internalPlugins from '../plugins';
import type { GatewayApi } from '@repo/plugin-sdk';

export async function loadPlugins(app: FastifyInstance) {
  const api: GatewayApi = {
    logger: {
      info: (msg, meta) => app.log.info(meta, msg),
      error: (msg, meta) => app.log.error(meta, msg),
    },
    hooks: {
      onSend: (handler) => {
        const hook: onSendAsyncHookHandler = async (req, reply, payload) => {
          try {
            await handler({ req, reply });
          } catch (e) {
            app.log.error(e, 'plugin onSend hook error');
          }
          return payload;
        };
        app.addHook('onSend', hook);
      },
    },
  };

  for (const plugin of internalPlugins) {
    try {
      await plugin.register(api, { appVersion: '0.1.0' });
      app.log.info({ plugin: plugin.id }, 'plugin loaded');
    } catch (e) {
      app.log.error({ plugin: plugin.id, err: e }, 'failed to load plugin');
    }
  }
}
