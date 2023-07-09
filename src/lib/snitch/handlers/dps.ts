import { EntityEvent, WowEvent, casts } from '../events';
import { CreateHandler } from './domain';
import type { State } from '..';

export interface DpsGroup {
    entities: Record<
        string,
        {
            damageTotal: number;
        }
    >;
    active: boolean;
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
            state.dps.challengeMode = {
                timeStart: event.time,
                timeLast: event.time,
                active: true,
                entities: {},
            };
        }
        if (casts.eventIsChallengeModeEnd(event)) {
            if (!state.dps.challengeMode) return;
            state.dps.challengeMode!.active = false;
        }
        if (casts.eventIsEncounterStart(event)) {
            state.dps.encounter = {
                timeStart: event.time,
                timeLast: event.time,
                active: true,
                entities: {},
            };
        }
        if (casts.eventIsEncounterEnd(event)) {
            if (!state.dps.encounter) return;
            state.dps.encounter!.active = false;
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
            if (state.dps.encounter) {
                state.dps.encounter.timeLast = event.time;
                const entityState = state.dps.encounter.entities[entity.guid] ?? { damageTotal: 0 };
                entityState.damageTotal += event.suffixes![0];
                state.dps.encounter!.entities[entity.guid] = entityState;
            }
            if (state.dps.challengeMode) {
                state.dps.challengeMode.timeLast = event.time;
                const entityState = state.dps.challengeMode.entities[entity.guid] ?? { damageTotal: 0 };
                entityState.damageTotal += event.suffixes![0];
                state.dps.challengeMode!.entities[entity.guid] = entityState;
            }
        }
    }
    return {
        initialState,
        handleEvent,
    };
};
