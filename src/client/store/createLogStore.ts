import type { ClientState, StoreEnhancer } from '../domain';

export interface LogActions {}
export interface LogState {
    lines: string[];
}

export const initialState: LogState = {
    lines: [],
};

export const createLogStore: StoreEnhancer = function (worker, actions, state, setState) {
    actions.log = {} as LogActions;

    worker.on('logEvents', (lines) => {
        setState('log', 'lines', (l) => lines);
    });
    return actions;
};
