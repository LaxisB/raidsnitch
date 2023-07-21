import { wrapLog } from '@/lib/log';
import * as snitch from '@/lib/snitch';
import { produce } from 'solid-js/store';
import type { StoreEnhancer } from '../../domain';

export interface SnitchActions {
  reset(): Promise<void>;
  handleEvents(events: any[]): void;
}

let handler = snitch.initialize();

export const initialState = structuredClone(snitch.initialState);

const log = wrapLog('snitchStore');

const STATE_UPDATE_INTERVAL = 500;

export const createSnitchStore: StoreEnhancer = function (actions, state, setState) {
  const eventBuffer = [];

  actions.snitch = {
    reset() {
      log.log('reset');
      handler = snitch.initialize();
      setState('snitch', structuredClone(snitch.initialState));
    },
    handleEvents: bufferedCall((events) => {
      setState(
        'snitch',
        produce((state) => {
          handler(state, events);
        }),
      );
    }, STATE_UPDATE_INTERVAL),
  } as SnitchActions;
};

function bufferedCall<T>(fn: (items: T[]) => any, interval: number) {
  let buffer: T[] = [];

  let timeout: NodeJS.Timeout | null = null;

  return function (items: T[]) {
    buffer.push(...items);
    if (timeout) {
      return;
    }
    timeout = setTimeout(() => {
      fn(buffer);
      buffer = [];
      timeout = null;
    }, interval);
  };
}
