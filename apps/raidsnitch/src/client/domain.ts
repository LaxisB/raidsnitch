import { Emitter } from '@raidsnitch/shared/emitter';
import type { AsyncClient } from '@raidsnitch/shared/rpc';
import type { SetStoreFunction } from 'solid-js/store';
import type { CoreEvents, CoreInterface } from '../core/domain';
import type { LogActions, LogState } from './store/createLogStore';
import type { UiActions, UiState } from './store/createUiStore';

export interface ClientState {
  ui: UiState;
  log: LogState;
  ready: boolean;
}

export interface ClientActions {
  ui: UiActions;
  log: LogActions;
}

export type ClientWorker = Emitter<CoreEvents> & AsyncClient<CoreInterface>;

export type StoreEnhancer = (
  worker: ClientWorker,
  actions: ClientActions,
  state: ClientState,
  setState: SetStoreFunction<ClientState>,
) => unknown;
