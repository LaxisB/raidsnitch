import { wrapLog } from '@/lib/log';
import { EntityEvent, WowEvent } from '@/lib/parser';
import type { State } from '..';
import { CreateHandler } from './domain';
import { EntityState } from './entities';

const log = wrapLog('dps handler');
export interface DpsMeasure {
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
    duration: number;
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
            event.name === 'SPELL_DAMAGE_SUPPORT' ||
            event.name === 'SWING_DAMAGE_LANDED_SUPPORT'
        ) {
            // ignore nullids
            if (event.baseParams.sourceGuid === '0000000000000000') return;
            let entity = state.entities[event.baseParams.sourceGuid];
            // stuff we don't know
            if (entity == null) {
                return;
            }
            while (entity?.ownerGuid && entity.ownerGuid != entity.guid) {
                entity = state.entities[entity.ownerGuid];
            }

            // event is stagger
            if (event.prefixes[0] === 124255 || event.baseParams.sourceGuid == event.baseParams.destGuid) {
                return;
            }
            // end stuff we can't attribute
            if (!entity || entity.guid?.startsWith('Player') === false) return;

            const activeSegments = [state.segments.active.encounter, state.segments.active.challenge].filter(Boolean) as string[];

            for (const segmentId of activeSegments) {
                if (!state.dps.bySegment[segmentId]) {
                    state.dps.bySegment[segmentId] = createDpsGroupState(event.time);
                }
                if (event.name === 'SPELL_DAMAGE_SUPPORT' || event.name === 'SWING_DAMAGE_LANDED_SUPPORT') {
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
    groupState.duration = event.time - groupState.timeStart;

    if (!groupState.entities[guid]) {
        const entity = state.entities[guid];
        groupState.entities[guid] = createDpsEntity(entity);
    }

    groupState.total += event.suffixes![0];
    addDamage(groupState, guid, event.suffixes![0], groupState.duration, groupState.total);
    sortGroup(groupState);
}

function reattributeDamage(state: State, groupState: DpsGroup, event: EntityEvent) {
    if (!groupState) {
        return;
    }
    groupState.duration = event.time - groupState.timeStart;
    const beneficiary = event.baseParams.sourceGuid;
    const source = event.suffixes[event.suffixes.length - 1];

    // get from direct beneficiary to owner (e.g pets to player)
    let beneficiaryEntity = state.entities[beneficiary];
    while (beneficiaryEntity?.ownerGuid) {
        beneficiaryEntity = state.entities[beneficiaryEntity.ownerGuid];
    }
    if (!groupState.entities[beneficiaryEntity.guid]) {
        groupState.entities[beneficiaryEntity.guid] = createDpsEntity(beneficiaryEntity);
    }

    const sourceEntity = state.entities[source];
    if (!groupState.entities[sourceEntity.guid]) {
        groupState.entities[source] = createDpsEntity(sourceEntity);
    }

    const amount = event.suffixes[0];

    addDamage(groupState, beneficiary, -amount, groupState.duration, groupState.total);
    addDamage(groupState, source, amount, groupState.duration, groupState.total);
    sortGroup(groupState);
}

function createDpsGroupState(time?: number): DpsGroup {
    return {
        total: 0,
        entities: {},
        ids: [],
        top: undefined,
        duration: time ?? 0,
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

function addDamage(state: DpsGroup, guid: string, amount: number, combatTime: number, total: number) {
    let measure = state.entities[guid];
    if (!measure) {
        throw new Error(`No measure for ${guid}`);
    }
    measure.total += amount;
}

function sortGroup(groupState: DpsGroup) {
    groupState.ids = Object.entries(groupState.entities)
        .sort(([, a], [, b]) => b.total - a.total)
        .map(([guid]) => guid);

    for (let id in groupState.entities) {
        const entity = groupState.entities[id];
        entity.perSecond = entity.total / groupState.duration;
        entity.percent = (entity.total * 100) / groupState.total;
    }

    groupState.top = { ...groupState.entities[groupState.ids[0]] };
}
