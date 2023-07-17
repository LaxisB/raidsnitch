import { EntityEvent, WowEvent } from '@raidsnitch/parser';
import type { State } from '..';
import { CreateHandler } from './domain';

interface DpsMeasure {
  total: number;
  perSecond: number;
  percent: number;
}

export interface DpsGroup {
  entities: Record<string, DpsMeasure>;
  ids: string[];
  top?: DpsMeasure;
  total: number;
  timeStart: number;
  timeLast: number;
}

export interface DpsState {
  bySegment: Record<string, DpsGroup>;
}

export const createDpsHandler: CreateHandler<DpsState> = () => {
  let initialState: DpsState = {
    bySegment: {},
  };

  function handleEvent(event: WowEvent, state: State) {
    if (
      event.name === 'SPELL_DAMAGE' ||
      event.name === 'SPELL_PERIODIC_DAMAGE' ||
      event.name === 'SWING_DAMAGE' ||
      event.name === 'RANGE_DAMAGE'
    ) {
      // ignore nullids
      if (event.baseParams.sourceGuid === '0000000000000000') return;
      let entity = state.entities[event.baseParams.sourceGuid];
      // stuff we don't know
      if (!entity) return;
      while (entity.ownerGuid) {
        entity = state.entities[entity.ownerGuid];
      }
      // end stuff we can't attribute
      if (!entity || entity.guid?.startsWith('Player') === false) return;

      const activeSegments = [state.segments.active.encounter, state.segments.active.challenge].filter(Boolean) as string[];

      for (const segmentId of activeSegments) {
        if (!state.dps.bySegment[segmentId]) {
          state.dps.bySegment[segmentId] = createDpsGroupState(event.time);
        }
        updateDpsGroup(state.dps.bySegment[segmentId], entity.guid, event);
      }
    }
  }
  return {
    initialState,
    handleEvent,
  };
};

function updateDpsGroup(state: DpsGroup | undefined, guid: string, event: EntityEvent) {
  if (!state) {
    return;
  }
  state.timeLast = event.time;
  if (!state.entities[guid]) {
    state.entities[guid] = {
      total: 0,
      perSecond: 0,
      percent: 0,
    };
  }
  const entityState = state.entities[guid];

  state.total += event.suffixes![0];
  entityState.total += event.suffixes![0];
  entityState.perSecond = entityState.total / ((event.time - state.timeStart) / 1000);
  entityState.percent = (entityState.total * 100) / state.total;
  state.ids = Object.entries(state.entities)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([guid]) => guid);

  state.top = { ...state.entities[state.ids[0]] };
}

function createDpsGroupState(time?: number): DpsGroup {
  return {
    total: 0,
    entities: {},
    ids: [],
    top: undefined,
    timeLast: time ?? 0,
    timeStart: time ?? 0,
  };
}
