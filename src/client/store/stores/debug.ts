import { batch } from 'solid-js';
import { StoreEnhancer } from '../../domain';

export interface DebugActions {
    dbg(data: any): void;
    reset(): void;
}

export type DebugState = Record<string, any>;

export const initialState: DebugState = {};

export const createDebugStore: StoreEnhancer = function (actions, state, setState) {
    actions.debug = {
        dbg(debug) {
            batch(() => {
                for (const key in debug) {
                    if (typeof debug[key] === 'number') {
                        setState('debug', key, (old) => {
                            if (!old) {
                                return [debug[key]];
                            }
                            return old.concat(debug[key]);
                        });
                    } else {
                        if (state.debug[key] !== debug[key]) {
                            setState('debug', key, debug[key]);
                        }
                    }
                }
            });
        },
        reset() {
            setState('debug', {});
        },
    };
};
