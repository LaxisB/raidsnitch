import { SetStoreFunction } from 'solid-js/store';
import { CoreEvents, CoreInterface, LogStates } from '../core/domain';
import { Emitter } from '../lib/emitter';
import { AsyncClient } from '../lib/rpc';
import type { FsActions, FsState } from './store/createFsStore';
import type { UiActions, UiState } from './store/createUiStore';
import { LogActions, LogState } from './store/createLogStore';

export interface ClientState {
    ui: UiState;
    fs: FsState;
    log: LogState;
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
