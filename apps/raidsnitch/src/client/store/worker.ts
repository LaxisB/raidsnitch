import { Emitter } from '@raidsnitch/shared/emitter';
import { wrapLog } from '@raidsnitch/shared/log';
import { RpcEvent, RpcResponse, createNaiveClient } from '@raidsnitch/shared/rpc';
import type { CoreEvents, CoreInterface } from '../../core/domain';
import type { ClientWorker } from '../domain';

let _worker: ClientWorker;

let log = wrapLog('client worker');

export function getWorker() {
  if (!_worker) {
    log.log('creating worker instance');
    let workerRef = new Worker(new URL('../../core/worker.ts', import.meta.url), { type: 'module', name: 'core' });

    log.log('creating emitter');
    let emitter = new Emitter<CoreEvents>();
    emitter.unhandled((event, payload) => {
      log.warn('unhandled event', event, payload);
    });
    workerRef.addEventListener('message', (event) => {
      const d = event.data as RpcResponse<unknown, unknown> | RpcEvent;
      if (d.type === 'event') {
        emitter.emit(d.event as any, d.data as any);
      }
    });
    workerRef.addEventListener('error', (e) => {
      log.error('crashed', e);
    });
    workerRef.addEventListener('messageerror', (e) => {
      log.error('message error', e);
    });
    log.log('wrapping as asyncclient');
    _worker = createNaiveClient<CoreInterface, typeof emitter>(emitter, workerRef);
    log.log('done');
  }
  return _worker;
}
