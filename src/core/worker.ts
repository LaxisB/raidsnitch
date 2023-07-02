import { RpcEvent, RpcRequest, setupRpcHandlers } from '../lib/rpc';
import { FsHandler } from './fsHandler';
import { wrapLog } from '../lib/log';
import { CoreInterface } from './domain';
import { emitter } from './emitter';

let log = wrapLog('rpc server');
let state: FsHandler;

emitter.any((event, payload) => {
    globalThis.postMessage({
        type: 'event' as const,
        event,
        data: payload,
    } as RpcEvent);
});

const handlers: CoreInterface = {
    async restore() {
        if (!state) {
            state = new FsHandler();
        }
        await state.restore();
    },

    async watchDirectory(handle: FileSystemDirectoryHandle) {
        if (!state) {
            return Promise.reject({
                message: 'Not Initialized',
            });
        }
        state.watchDirectory(handle);
    },
    async stop() {
        if (!state) {
            return Promise.reject({
                message: 'Not Initialized',
            });
        }
        state.stop();
    },
};

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
