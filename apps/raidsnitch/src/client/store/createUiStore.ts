import { LogStates } from '../../core/domain';
import type { StoreEnhancer } from '../domain';

export type ClientUiViewstate = 'initial' | 'need_file' | 'need_permisison' | 'ready';
export interface UiActions {}
export interface UiState {
  viewstate: ClientUiViewstate;
  loading: number;
}

export const initialState: UiState = {
  viewstate: 'initial',
  loading: 0,
};

export const createUiStore: StoreEnhancer = function (worker, actions, state, setState) {
  actions.ui = {} as UiActions;

  worker.on('dirWatcherState', (state) => {
    switch (state) {
      case LogStates.NEED_DIR:
        setState('ui', 'viewstate', 'need_file');
        break;
      case LogStates.NEED_PERMISSION:
        setState('ui', 'viewstate', 'need_permisison');
        break;
      case LogStates.HAS_DIR:
      case LogStates.HAS_FILE:
        setState('ui', 'viewstate', 'ready');
        break;
    }
  });
};
