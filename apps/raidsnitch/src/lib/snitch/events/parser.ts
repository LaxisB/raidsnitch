import { DataLine } from '@raidsnitch/logparser';
import {
    EventName,
    type AdvancedParams,
    type EventBaseParams,
    type WowEvent,
    type GlobalEvents,
    EntityEvent,
} from './domain';

const NONSTANDARD_EVENTS: string[] = [
    EventName.ZONE_CHANGE,
    EventName.MAP_CHANGE,
    EventName.WORLD_MARKER_PLACED,
    EventName.WORLD_MARKER_REMOVED,
    EventName.ENCOUNTER_START,
    EventName.ENCOUNTER_END,
    EventName.CHALLENGE_MODE_START,
    EventName.CHALLENGE_MODE_END,
    EventName.COMBATANT_INFO,
] as any;

const PREFIX_COUNT = {
    SWING: 0,
    RANGE: 3,
    SPELL: 3,
    SPELL_PERIODIC: 3,
    SPELL_BUILDING: 3,
    ENVIRONMENTAL: 1,
};
const HAS_PREFIX = Object.keys(PREFIX_COUNT) as (keyof typeof PREFIX_COUNT)[];

export function parseAsEvent(base: DataLine, referenceTime?: number): WowEvent {
    let time: number;
    let deltaTime: number;
    let name: string;
    let baseParams: EventBaseParams | undefined;
    let prefixes: any[] | undefined;
    let advanced: AdvancedParams | undefined;
    let misc: any[] | null = null;

    time = base.time;
    deltaTime = referenceTime ? base.time - referenceTime : 0;
    name = base.event;

    let payload = [...base.payload];
    if (NONSTANDARD_EVENTS.includes(base.event) || payload.length < 8) {
        misc = payload;
        return { time, deltaTime, name, untyped: misc } as GlobalEvents;
    }

    let bp = payload.splice(0, 8);
    baseParams = _parseBaseParams(bp);

    const prefixName = HAS_PREFIX.find((x) => base.event.startsWith(x))!;
    if (prefixName) {
        const prefixVars = payload.splice(0, PREFIX_COUNT[prefixName]);
        prefixes = prefixVars;
    }
    const hasAdvanced = payload.length >= 17;
    if (hasAdvanced) {
        advanced = _parseAdvancedParams(payload);
    }
    const suffixes = payload;

    return {
        time,
        deltaTime,
        name,
        baseParams,
        prefixes,
        advanced,
        suffixes,
        untyped: misc,
    } as EntityEvent;
}

function _parseBaseParams(payload: any[]): EventBaseParams {
    return {
        sourceGuid: payload[0],
        sourceName: payload[1],
        sourceFlags: payload[2],
        sourceRaidFlags: payload[3],
        destGuid: payload[4],
        destName: payload[5],
        destFlags: payload[6],
        destRaidFlags: payload[7],
    };
}

function _parseAdvancedParams(payload: any[]): AdvancedParams {
    const params = payload.splice(0, 17);
    return {
        infoGuid: params.shift(),
        ownerGuid: params.shift(),
        currentHp: params.shift(),
        maxHp: params.shift(),
        attackPower: params.shift(),
        spellPower: params.shift(),
        armor: params.shift(),
        absorb: params.shift(),
        powerType: params.shift(),
        currentPower: params.shift(),
        maxPower: params.shift(),
        powerCost: params.shift(),
        positionX: params.shift(),
        positionY: params.shift(),
        uiMapId: params.shift(),
        facing: params.shift(),
        level: params.shift(),
    };
}

function _parsePrefix(payload: any[]): any[] {
    return payload;
}
