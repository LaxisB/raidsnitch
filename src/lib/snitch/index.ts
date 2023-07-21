import { WowEvent } from '@/lib/parser';
import { createDpsHandler } from './handlers/dps';
import { createEntitiesHandler } from './handlers/entities';
import { createHpsHandler } from './handlers/hps';
import { createSegmentHandler } from './handlers/segments';
import { createZoneHandler } from './handlers/zone';

export type State = typeof initialState;
export interface Snitch {
  state: State;
  handleEvents(events: WowEvent[]): void;
}

const zone = createZoneHandler();
const entities = createEntitiesHandler();
const dps = createDpsHandler();
const hps = createHpsHandler();
const segments = createSegmentHandler();

export const initialState = {
  zone: zone.initialState,
  entities: entities.initialState,
  dps: dps.initialState,
  hps: hps.initialState,
  segments: segments.initialState,
};

export function initialize() {
  let refTime = -1;

  const handlers = [segments.handleEvent, zone.handleEvent, entities.handleEvent, dps.handleEvent, hps.handleEvent];

  return function reduce(state: State, events: WowEvent[]) {
    events.forEach((event) => {
      if (refTime === -1) {
        refTime = event.time;
      }
      handlers.forEach((handler) => handler(event, state));
    });

    return state;
  };
}
