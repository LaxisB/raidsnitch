import { EntityEvent, GlobalEvent, WowEvent, casts } from '@/lib/parser';
import type { State } from '..';
import { CreateHandler } from './domain';

export interface EntityState {
    // meta
    guid: string;
    name: string;
    spec?: number;
    stats: Record<string, number>;
    flags: number;
    raidFlags: number;
    ownerGuid?: string;

    // stats
    hp: [current: number, max: number];
    power?: [current: number, max: number, type: any];
}

export interface EntitiesState {
    [guid: string]: EntityState;
}

const NULL_GUID = '0000000000000000';

export const createEntitiesHandler: CreateHandler<EntitiesState> = () => {
    let initialState: EntitiesState = {};

    function handleEvent(e: WowEvent, state: State) {
        if (casts.eventIsZoneChange(e)) {
            state.entities = {};
            return;
        }
        if (e.name === 'UNIT_DIED' || e.name === 'UNIT_DESTROYED' || e.name === 'UNIT_DISSIPATES') {
            const guid = e.baseParams.destGuid;
            if (guid && guid != NULL_GUID) {
                delete state.entities[guid];
            }
        }
        if (e.name === 'COMBATANT_INFO') {
            const event = e as any as GlobalEvent;

            const [
                guid,
                _unknown1,
                str,
                agi,
                stam,
                int,
                dodge,
                parry,
                block,
                critmelee,
                critranged,
                crispell,
                speed,
                leech,
                hastemelee,
                hasteranged,
                hastespell,
                avoidance,
                mastery,
                versdamage,
                versheal,
                verstaken,
                armor,
                spec,
            ] = event.untyped;
            const talents = event.untyped[24];
            const pvpTalents = event.untyped[25];
            const items = event.untyped[26];
            const interestingAuras = event.untyped[27];

            let entity = state.entities[guid];
            if (!entity) {
                entity = state.entities[guid] = {
                    guid,
                    name: '',
                    flags: 0,
                    raidFlags: 0,
                    hp: [0, 0],
                    stats: {},
                };
            }
            Object.assign(entity, {
                spec,
                stats: {
                    str,
                    agi,
                    stam,
                    int,
                    dodge,
                    parry,
                    block,
                    critmelee,
                    critranged,
                    crispell,
                    speed,
                    leech,
                    hastemelee,
                    hasteranged,
                    hastespell,
                    avoidance,
                    mastery,
                    versdamage,
                    versheal,
                    verstaken,
                    armor,
                },
            });
        }

        // don't handle other global events
        if ('advanced' in e === false) {
            return;
        }
        const event = e as EntityEvent;

        const sourceGuid = event.baseParams.sourceGuid;
        if (sourceGuid && guidIsInteresting(sourceGuid) && !state.entities[sourceGuid]?.name) {
            state.entities[sourceGuid] = Object.assign(state.entities[sourceGuid] ?? {}, {
                guid: sourceGuid,
                name: event.baseParams.sourceName,
                flags: event.baseParams.sourceFlags,
                raidFlags: event.baseParams.sourceRaidFlags,
                hp: [0, 0],
                stats: {},
            });
        }

        const destGuid = event.baseParams.destGuid;
        if (destGuid && guidIsInteresting(destGuid) && !state.entities[destGuid]?.name) {
            state.entities[destGuid] = Object.assign(state.entities[destGuid] ?? {}, {
                guid: destGuid,
                name: event.baseParams.destName,
                flags: event.baseParams.destFlags,
                raidFlags: event.baseParams.destRaidFlags,
                ownerGuid: getOwnerGuid(event),
                hp: [0, 0],
                stats: {},
            });
        }

        const infoGuid = event.advanced?.infoGuid;
        if (infoGuid && guidIsInteresting(infoGuid) && state.entities[infoGuid]?.name) {
            const entity = state.entities[infoGuid];
            if (event.advanced?.currentHp! === 0 && !infoGuid.startsWith('Player-')) {
                delete state.entities[infoGuid];
                return;
            }
            const ownerGuid = getOwnerGuid(event);
            if (ownerGuid) {
                entity.ownerGuid = ownerGuid;
            }
            if (!event.advanced) {
                return;
            }
            entity.hp = [event.advanced!.currentHp ?? 0, event.advanced!.maxHp ?? 0];
            entity.power = [event.advanced!.currentPower, event.advanced!.maxPower, event.advanced!.powerType];
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
