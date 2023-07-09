import { EntityEvent, WowEvent, casts } from '../events';
import { CreateHandler } from './domain';
import type { State } from '..';

export interface EntityState {
    // meta
    guid: string;
    name: string;
    flags: number;
    raidFlags: number;
    x?: number;
    y?: number;
    facing?: number;
    ownerGuid?: string;

    // stats
    currentHp: number;
    maxHp: number;
    currentPower?: number;
    maxPower?: number;
}

export interface EntitiesState {
    [guid: string]: EntityState;
}

const NULL_GUID = '0000000000000000';

export const createEntitiesHandler: CreateHandler<EntitiesState> = () => {
    let initialState: EntitiesState = {};

    function handleEvent(e: WowEvent, state: State) {
        if (e.name === 'UNIT_DIED' || e.name === 'UNIT_DESTROYED' || e.name === 'UNIT_DISSIPATES') {
            const guid = e.baseParams.destGuid;
            if (guid && guid != NULL_GUID) {
                delete state.entities[guid];
            }
        }

        // don't handle other global events
        if ('advanced' in e === false) {
            return;
        }
        const event = e as EntityEvent;

        const sourceGuid = event.baseParams.sourceGuid;
        const destGuid = event.baseParams.destGuid;
        const infoGuid = event.advanced?.infoGuid;

        if (sourceGuid && guidIsInteresting(sourceGuid) && !state.entities[sourceGuid]) {
            state.entities[sourceGuid] = {
                guid: sourceGuid,
                name: event.baseParams.sourceName,
                flags: event.baseParams.sourceFlags,
                raidFlags: event.baseParams.sourceRaidFlags,
                currentHp: 0,
                maxHp: 0,
            };
        }
        if (destGuid && guidIsInteresting(destGuid) && !state.entities[destGuid]) {
            state.entities[destGuid] = {
                guid: destGuid,
                name: event.baseParams.destName,
                flags: event.baseParams.destFlags,
                raidFlags: event.baseParams.destRaidFlags,
                currentHp: 0,
                maxHp: 0,
                ownerGuid: getOwnerGuid(event),
            };
        }

        if (infoGuid && guidIsInteresting(infoGuid) && state.entities[infoGuid]) {
            const entity = state.entities[infoGuid];
            if (event.advanced?.currentHp! === 0 && !infoGuid.startsWith('Player-')) {
                delete state.entities[infoGuid];
                return;
            }
            const ownerGuid = getOwnerGuid(event);
            if (ownerGuid) {
                entity.ownerGuid = ownerGuid;
            }
            entity.currentHp = event.advanced?.currentHp!;
            entity.maxHp = event.advanced?.maxHp!;
            entity.x = event.advanced?.positionX;
            entity.y = event.advanced?.positionY;
            entity.facing = event.advanced?.facing;
            entity.currentPower = event.advanced?.currentPower;
            entity.maxPower = event.advanced?.maxPower;
        }
    }
    return {
        initialState,
        handleEvent,
    };
};

function guidIsInteresting(guid: string) {
    return (
        guid &&
        typeof guid === 'string' &&
        guid != NULL_GUID &&
        (guid.startsWith('Player-') || guid.startsWith('Creature-') || guid.startsWith('Pet-'))
    );
}

function getOwnerGuid(event: EntityEvent) {
    if (event.name === 'SPELL_SUMMON') {
        return event.baseParams.sourceGuid;
    } else if (event.advanced && event.advanced.ownerGuid !== '0000000000000000') {
        return event.advanced.ownerGuid;
    }
}
