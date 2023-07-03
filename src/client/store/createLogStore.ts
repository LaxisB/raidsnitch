import type { ClientState, StoreEnhancer } from '../domain';

export interface LogActions {}

export const initialState: ClientState['log'] = {
    lines: [],
};

export const createLogStore: StoreEnhancer = function (worker, actions, state, setState) {
    actions.log = {} as LogActions;

    worker.on('logEvents', (lines) => {
        setState('log', 'lines', (l) => lines);
    });
    return actions;
};
