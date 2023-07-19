import { StoreEnhancer } from '../../domain';

export interface DebugActions {
  dbg(data: any): void;
  reset(): void;
}

export type DebugState = Record<string, any>;

export const initialState: DebugState = {};

export const createDebugStore: StoreEnhancer = function (actions, state, setState) {
  actions.debug = {
    dbg(data) {
      for (const key in data) {
        setState('debug', key, (old) => {
          if (!old) {
            return [data[key]];
          }
          return old.concat(data[key]);
        });
      }
    },
    reset() {
      setState('debug', {});
    },
  } as DebugActions;
};
