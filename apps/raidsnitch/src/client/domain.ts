import { State as SnitchState } from '@raidsnitch/snitch';
import type { SetStoreFunction } from 'solid-js/store';
import { DebugActions, DebugState } from './store/stores/debug';
import type { LogActions, LogState } from './store/stores/log';
import { SnitchActions } from './store/stores/snitch';
import type { UiActions, UiState } from './store/stores/ui';

export interface State {
  ui: UiState;
  log: LogState;
  snitch: SnitchState;
  debug: DebugState;
}

export interface Actions {
  ui: UiActions;
  log: LogActions;
  snitch: SnitchActions;
  debug: DebugActions;
  initialize(): void;
}

export type StoreEnhancer = (actions: Actions, state: State, setState: SetStoreFunction<State>) => unknown;
