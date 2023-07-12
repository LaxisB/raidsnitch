import { EntityEvent, WowEvent, casts } from '@raidsnitch/parser';
import type { State } from '..';
import { CreateHandler } from './domain';

interface DpsMeasure {
  damageTotal: number;
  dps: number;
  percent: number;
}

export interface DpsGroup {
  entities: Record<string, DpsMeasure>;
  ids: string[];
  active: boolean;
  topPerformer?: DpsMeasure;
  damageTotal: number;
  timeStart: number;
  timeLast: number;
}

export interface DpsState {
  challengeMode?: DpsGroup;
  encounter?: DpsGroup;
}

export const createDpsHandler: CreateHandler<DpsState> = () => {
  let initialState: DpsState = {};

  function handleEvent(event: WowEvent, state: State) {
    if (casts.eventIsChallengeModeStart(event)) {
      state.dps.challengeMode = createDpsGroupState(event.time);
      return;
    }
    if (casts.eventIsChallengeModeEnd(event)) {
      if (!state.dps.challengeMode) return;
      state.dps.challengeMode.active = false;
      return;
    }
    if (casts.eventIsEncounterStart(event)) {
      state.dps.encounter = createDpsGroupState(event.time);
      return;
    }
    if (casts.eventIsEncounterEnd(event)) {
      if (!state.dps.encounter) return;
      state.dps.encounter.active = false;
      return;
    }

    if (
      event.name === 'SPELL_DAMAGE' ||
      event.name === 'SPELL_PERIODIC_DAMAGE' ||
      event.name === 'SWING_DAMAGE' ||
      event.name === 'RANGE_DAMAGE'
    ) {
      if (event.baseParams.sourceGuid === '0000000000000000') return;
      let entity = state.entities[event.baseParams.sourceGuid];
      if (!entity) return;
      while (entity.ownerGuid) {
        entity = state.entities[entity.ownerGuid];
      }
      if (!entity || entity.guid?.startsWith('Player') === false) return;
      updateDpsGroup(state.dps.encounter, entity.guid, event);
      updateDpsGroup(state.dps.challengeMode, entity.guid, event);
    }
  }
  return {
    initialState,
    handleEvent,
  };
};

function updateDpsGroup(state: DpsGroup | undefined, guid: string, event: EntityEvent) {
  if (!state || !state.active) {
    return;
  }
  state.timeLast = event.time;
  if (!state.entities[guid]) {
    state.entities[guid] = {
      damageTotal: 0,
      dps: 0,
      percent: 0,
    };
  }
  const entityState = state.entities[guid];

  state.damageTotal += event.suffixes![0];
  entityState.damageTotal += event.suffixes![0];
  entityState.dps = entityState.damageTotal / ((event.time - state.timeStart) / 1000);
  entityState.percent = (entityState.damageTotal * 100) / state.damageTotal;
  state.ids = Object.entries(state.entities)
    .sort(([, a], [, b]) => b.damageTotal - a.damageTotal)
    .map(([guid]) => guid);

  state.topPerformer = { ...state.entities[state.ids[0]] };
}

function createDpsGroupState(time?: number): DpsGroup {
  return {
    active: true,
    damageTotal: 0,
    entities: {},
    ids: [],
    topPerformer: undefined,
    timeLast: time ?? 0,
    timeStart: time ?? 0,
  };
}
