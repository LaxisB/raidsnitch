import type { StoreEnhancer } from '../../domain';

export type ClientUiViewstate = 'initial' | 'need_file' | 'need_permisison' | 'ready';
export interface UiActions {
  setViewstate(viewstate: ClientUiViewstate): void;
}
export interface UiState {
  viewstate: ClientUiViewstate;
  loading: number;
}

export const initialState: UiState = {
  viewstate: 'initial',
  loading: 0,
};

export const createUiStore: StoreEnhancer = function (actions, state, setState) {
  actions.ui = {
    setViewstate(viewstate) {
      setState('ui', 'viewstate', viewstate);
    },
  } as UiActions;
};
