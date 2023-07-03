import { SetStoreFunction } from 'solid-js/store';
import { CoreEvents, CoreInterface, LogStates } from '../core/domain';
import { Emitter } from '../lib/emitter';
import { AsyncClient } from '../lib/rpc';
import type { FsActions } from './store/createFsStore';
import type { UiActions } from './store/createUiStore';
import { LogActions } from './store/createLogStore';

export type ClientUiViewstate = 'initial' | 'need_file' | 'need_permisison' | 'ready';

export interface ClientState {
    ui: {
        viewstate: ClientUiViewstate;
        loading: number;
    };
    fs: {
        state: LogStates;
        debug: Record<string, any[]>;
    };
    log: {
        lines: string[];
    };
    ready: boolean;
}

export interface ClientActions {
    ui: UiActions;
    fs: FsActions;
    log: LogActions;
}

export type ClientWorker = Emitter<CoreEvents> & AsyncClient<CoreInterface>;

export type StoreEnhancer = (
    worker: ClientWorker,
    actions: ClientActions,
    state: ClientState,
    setState: SetStoreFunction<ClientState>,
) => unknown;
