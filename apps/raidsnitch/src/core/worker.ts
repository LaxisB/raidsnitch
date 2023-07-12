import { wrapLog } from '@raidsnitch/shared/log';
import { RpcEvent, RpcRequest, setupRpcHandlers } from '@raidsnitch/shared/rpc';
import { handlers } from './api';
import { emitter } from './emitter';

let log = wrapLog('core worker');

emitter.any((event, payload) => {
  globalThis.postMessage({
    type: 'event' as const,
    event,
    data: payload,
  } as RpcEvent);
});

const messageHandler = setupRpcHandlers(
  handlers as any,
  function (request: RpcRequest<unknown>, response: { result: any } | { error: any }) {
    const payload = {
      ...response,
      id: request.id,
      type: 'rpc' as const,
    };
    globalThis.postMessage(payload);
  },
);

globalThis.addEventListener('message', function (event) {
  messageHandler(event.data);
});

globalThis.onerror = function (event) {
  log.error('error', event);
};
