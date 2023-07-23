import { EntityEvent, WowEvent } from '@/lib/parser';
import type { State } from '..';
import { CreateHandler } from './domain';

interface HpsMeasure {
    total: number;
    perSecond: number;
    percent: number;
}

export interface HpsGroup {
    entities: Record<string, HpsMeasure>;
    ids: string[];
    top?: HpsMeasure;
    total: number;
    timeStart: number;
    timeLast: number;
}

export interface HpsState {
    bySegment: Record<string, HpsGroup>;
}

export const createHpsHandler: CreateHandler<HpsState> = () => {
    let initialState: HpsState = {
        bySegment: {},
    };

    function handleEvent(event: WowEvent, state: State) {
        if (event.name === 'SPELL_HEAL' || event.name === 'SPELL_PERIODIC_HEAL') {
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
                if (!state.hps.bySegment[segmentId]) {
                    state.hps.bySegment[segmentId] = createHpsGroupState(event.time);
                }
                updateHpsGroup(state.hps.bySegment[segmentId], entity.guid, event);
            }
        }
    }
    return {
        initialState,
        handleEvent,
    };
};

function updateHpsGroup(state: HpsGroup | undefined, guid: string, event: EntityEvent) {
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

function createHpsGroupState(time?: number): HpsGroup {
    return {
        total: 0,
        entities: {},
        ids: [],
        top: undefined,
        timeLast: time ?? 0,
        timeStart: time ?? 0,
    };
}
