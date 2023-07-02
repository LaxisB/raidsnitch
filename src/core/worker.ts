import { RpcEvent, RpcRequest, setupRpcHandlers } from '../lib/rpc';
import { wrapLog } from '../lib/log';
import { emitter } from './emitter';
import { handlers } from './api';

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
