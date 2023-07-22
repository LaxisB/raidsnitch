import { wrapLog } from '@/lib/log';
import { EntityEvent, WowEvent } from '@/lib/parser';
import type { State } from '..';
import { CreateHandler } from './domain';
import { EntityState } from './entities';

const log = wrapLog('dps handler');
interface DpsMeasure {
  guid?: string;
  name?: string;
  spec?: number;
  entity?: any;
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
      event.name === 'RANGE_DAMAGE' ||
      event.name === 'SPELL_DAMAGE_SUPPORT'
    ) {
      // ignore nullids
      if (event.baseParams.sourceGuid === '0000000000000000') return;
      let entity = state.entities[event.baseParams.sourceGuid];
      // stuff we don't know
      if (entity == null) {
        return;
      }
      while (entity?.ownerGuid) {
        entity = state.entities[entity.ownerGuid];
      }
      // end stuff we can't attribute
      if (!entity || entity.guid?.startsWith('Player') === false) return;

      const activeSegments = [state.segments.active.encounter, state.segments.active.challenge].filter(Boolean) as string[];

      for (const segmentId of activeSegments) {
        if (!state.dps.bySegment[segmentId]) {
          state.dps.bySegment[segmentId] = createDpsGroupState(event.time);
        }
        if (event.name === 'SPELL_DAMAGE_SUPPORT') {
          // SPELL_DAMAGE_SUPPORT appears in addition to SPELL_DAMAGE, so we need to subtract it
          reattributeDamage(state, state.dps.bySegment[segmentId], event);
        } else {
          updateDpsGroup(state, state.dps.bySegment[segmentId], entity.guid, event);
        }
      }
    }
  }
  return {
    initialState,
    handleEvent,
  };
};

function updateDpsGroup(state: State, groupState: DpsGroup | undefined, guid: string, event: EntityEvent) {
  if (!groupState) {
    return;
  }
  groupState.timeLast = event.time;
  if (!groupState.entities[guid]) {
    const entity = state.entities[guid];
    groupState.entities[guid] = {
      guid: entity?.guid,
      name: entity?.name,
      spec: entity?.spec,
      entity,
      total: 0,
      perSecond: 0,
      percent: 0,
    };
  }
  const entityState = groupState.entities[guid];

  groupState.total += event.suffixes![0];
  entityState.total += event.suffixes![0];
  entityState.perSecond = entityState.total / ((event.time - groupState.timeStart) / 1000);
  entityState.percent = (entityState.total * 100) / groupState.total;
  groupState.ids = Object.entries(groupState.entities)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([guid]) => guid);

  groupState.top = { ...groupState.entities[groupState.ids[0]] };
}

function reattributeDamage(state: State, groupState: DpsGroup, event: EntityEvent) {
  if (!groupState) {
    return;
  }
  groupState.timeLast = event.time;
  const beneficiary = event.baseParams.sourceGuid;
  const source = event.suffixes[10];

  // get from direct beneficiary to owner (e.g pets to player)
  let beneficiaryEntity = state.entities[beneficiary];
  while (beneficiaryEntity?.ownerGuid) {
    beneficiaryEntity = state.entities[beneficiaryEntity.ownerGuid];
  }
  let beneficiaryState = groupState.entities[beneficiaryEntity.guid];
  if (!beneficiaryState) {
    groupState.entities[beneficiaryEntity.guid] = createDpsEntity(beneficiaryEntity);
    beneficiaryState = groupState.entities[beneficiaryEntity.guid];
  }

  const sourceEntity = state.entities[source];
  let sourceState = groupState.entities[source];
  if (!sourceState) {
    groupState.entities[source] = createDpsEntity(sourceEntity);
    sourceState = groupState.entities[source];
  }

  const amount = event.suffixes[0];

  beneficiaryState.total -= amount;
  beneficiaryState.perSecond = beneficiaryState.total / ((event.time - groupState.timeStart) / 1000);
  beneficiaryState.percent = (beneficiaryState.total * 100) / groupState.total;

  sourceState.total += amount;
  sourceState.perSecond = sourceState.total / ((event.time - groupState.timeStart) / 1000);
  sourceState.percent = (sourceState.total * 100) / groupState.total;

  groupState.ids = Object.entries(groupState.entities)
    .sort(([, a], [, b]) => b.total - a.total)
    .map(([guid]) => guid);

  groupState.top = { ...groupState.entities[groupState.ids[0]] };
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


function createDpsEntity(entity: EntityState) {
  return {
    guid: entity.guid,
    name: entity.name,
    spec: entity.spec,
    total: 0,
    perSecond: 0,
    percent: 0,
  };
}
