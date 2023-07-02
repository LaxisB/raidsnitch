import { LogStates } from '../../core/domain';
import type { ClientState, StoreEnhancer } from '../domain';

export interface UiActions {}

export const initialState: ClientState['ui'] = {
    viewstate: 'initial',
    loading: 0,
};

export const createUiStore: StoreEnhancer = function (worker, actions, state, setState) {
    actions.ui = {} as UiActions;

    worker.on('state', (state) => {
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
    return actions;
};
