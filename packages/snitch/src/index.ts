import { WowEvent } from '@raidsnitch/parser';
import { createDpsHandler } from './handlers/dps';
import { createEntitiesHandler } from './handlers/entities';
import { createHpsHandler } from './handlers/hps';
import { createSegmentHandler } from './handlers/segments';
import { createZoneHandler } from './handlers/zone';

export type State = ReturnType<typeof initialize>['state'];
export interface Snitch {
  state: State;
  handleEvents(events: WowEvent[]): void;
}

export function initialize(handleStats: (stats: State) => void) {
  let refTime = -1;
  const zone = createZoneHandler();
  const entities = createEntitiesHandler();
  const dps = createDpsHandler();
  const hps = createHpsHandler();
  const segments = createSegmentHandler();

  let state = {
    zone: zone.initialState,
    entities: entities.initialState,
    dps: dps.initialState,
    hps: hps.initialState,
    segments: segments.initialState,
  };

  const handlers = [segments.handleEvent, zone.handleEvent, entities.handleEvent, dps.handleEvent, hps.handleEvent];

  function handleEvents(events: WowEvent[]) {
    events.forEach((event) => {
      if (refTime === -1) {
        refTime = event.time;
      }
      handlers.forEach((handler) => handler(event, state));
    });

    handleStats(state);
  }
  return {
    state,
    handleEvents,
  };
}
