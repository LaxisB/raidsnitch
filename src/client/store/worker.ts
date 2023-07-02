import { CoreEvents, CoreInterface } from '../../core/domain';
import { RpcResponse, RpcEvent, createNaiveClient } from '../../lib/rpc';
import { Emitter } from '../../lib/emitter';
import { ClientWorker } from '../domain';
import { wrapLog } from '../../lib/log';

let _worker: ClientWorker;

let log = wrapLog('client worker');

export function getWorker() {
    if (!_worker) {
        log.log('creating worker instance');
        let workerRef = new Worker(new URL('../../core/worker.ts', import.meta.url), { type: 'module' });

        log.log('creating emitter');
        let emitter = new Emitter<CoreEvents>();
        workerRef.addEventListener('message', (event) => {
            const d = event.data as RpcResponse<unknown, unknown> | RpcEvent;
            if (d.type === 'event') {
                emitter.emit(d.event as any, d.data as any);
            }
        });
        workerRef.addEventListener('error', (event) => {
            log.error('error', event.filename, event.lineno, event.message);
        });
        log.log('wrapping as asyncclient');
        _worker = createNaiveClient<CoreInterface, typeof emitter>(emitter, workerRef);
        log.log('done');
    }
    return _worker;
}
