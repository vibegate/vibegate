export interface PluginContext {
  appVersion: string;
}

export interface GatewayApi {
  // Limited, stable API surface plugins can use
  logger: {
    info: (msg: string, meta?: any) => void;
    error: (msg: string, meta?: any) => void;
  };
  hooks: {
    onSend: (handler: (payload: { req: any; reply: any }) => Promise<void> | void) => void;
  };
}

export interface VibeGatePlugin {
  id: string;
  version: string;
  register: (api: GatewayApi, ctx: PluginContext) => Promise<void> | void;
}

