import { State as SnitchState } from '@/lib/snitch';
import type { SetStoreFunction } from 'solid-js/store';
import { DebugActions, DebugState } from './store/stores/debug';
import type { LogActions, LogState } from './store/stores/log';
import { SnitchActions } from './store/stores/snitch';
import { UiActions, UiState } from './store/stores/ui';

export interface State {
    log: LogState;
    snitch: SnitchState;
    debug: DebugState;
    ui: UiState;
}

export interface Actions {
    log: LogActions;
    snitch: SnitchActions;
    debug: DebugActions;
    ui: UiActions;
    initialize(): void;
}

export type StoreEnhancer = (actions: Actions, state: State, setState: SetStoreFunction<State>) => unknown;
