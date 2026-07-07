import type { TraceLayerApi } from '../electron/preload';

declare global {
  interface Window {
    traceLayer: TraceLayerApi;
  }
}

export {};
