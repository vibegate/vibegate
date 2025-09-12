import type { VibeGatePlugin } from '@repo/plugin-sdk';

const exampleHeaderPlugin: VibeGatePlugin = {
  id: 'example-header',
  version: '0.1.0',
  register(api) {
    api.logger.info('Registering example-header plugin');
    api.hooks.onSend(async ({ reply }) => {
      try {
        reply.header('x-vibegate', 'on');
      } catch (e) {
        api.logger.error('example-header failed to set header', e);
      }
    });
  },
};

export default exampleHeaderPlugin;
