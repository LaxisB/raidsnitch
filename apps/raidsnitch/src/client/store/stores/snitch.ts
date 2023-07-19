import { wrapLog } from '@raidsnitch/shared/log';
import * as snitch from '@raidsnitch/snitch';
import { produce } from 'solid-js/store';
import type { StoreEnhancer } from '../../domain';

export interface SnitchActions {
  reset(): Promise<void>;
  handleEvents(events: any[]): void;
}

export interface SnitchState {}

let handler = snitch.initialize();

export const initialState = structuredClone(snitch.initialState);

const log = wrapLog('snitchStore');

export const createSnitchStore: StoreEnhancer = function (actions, state, setState) {
  actions.snitch = {
    reset() {
      log.log('reset');
      handler = snitch.initialize();
      setState('snitch', structuredClone(snitch.initialState));
    },
    handleEvents(events) {
      setState(
        'snitch',
        produce((state) => {
          handler(state, events);
        }),
      );
    },
  } as SnitchActions;
};
