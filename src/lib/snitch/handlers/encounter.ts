import { WowEvent, casts } from '../events';
import { CreateHandler } from './domain';
import type { State } from '../';
export interface EncounterState {
    inEncounter: boolean;
    encounterName: string;
    difficultyId: number;
    raidSize: number;
    instanceId: number;
    encounterSuccess: number;
}

export const createEncounterHandler: CreateHandler<EncounterState> = () => {
    let initialState: EncounterState = {
        inEncounter: false,
        encounterName: '',
        difficultyId: 0,
        raidSize: 0,
        instanceId: 0,
        encounterSuccess: 0,
    };

    function handleEvent(event: WowEvent, state: State) {
        if (casts.eventIsEncounterStart(event)) {
            state.encounter = {
                inEncounter: true,
                encounterName: event.untyped[1],
                difficultyId: event.untyped[2],
                raidSize: event.untyped[3],
                instanceId: event.untyped[4],
                encounterSuccess: -1,
            };
        }
        if (casts.eventIsEncounterEnd(event)) {
            state.encounter = {
                inEncounter: false,
                encounterName: event.untyped[1],
                difficultyId: event.untyped[2],
                raidSize: event.untyped[3],
                instanceId: event.untyped[4],
                encounterSuccess: event.untyped[5],
            };
        }
    }
    return {
        initialState,
        handleEvent,
    };
};
