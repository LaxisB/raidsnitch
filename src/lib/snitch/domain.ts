export interface EventBase {
    time: number;
    offset: number;
    line: string;
}

interface ZoneChangeEvent extends EventBase {
    event: 'ZONE_CHANGE';
    payload: [instanceId: number, zoneName: string, difficultyId: number];
}
interface EncounterStartEvent extends EventBase {
    event: 'ENCOUNTER_START';
    payload: [encounterId: number, name: string, difficulty: number, groupSize: number, instanceId: number];
}
interface EncounterEndEvent extends EventBase {
    event: 'ENCOUNTER_END';
    payload: [
        encounterId: number,
        name: string,
        difficulty: number,
        groupSize: number,
        success: number,
        fightTime: number,
    ];
}
interface ChallengeModeStartEvent extends EventBase {
    event: 'CHALLENGE_MODE_START';
    payload: [zoneName: string, instanceId: number, challengeModeId: number, keystoneLevel: number, ...affixes: any[]];
}
export interface ChallengeModeEndEvent extends EventBase {
    event: 'CHALLENGE_MODE_END';
    payload: [instanceId: number, success: number, keyStoneLevel: number, totalTime: number];
}

export type LogEvent =
    | ZoneChangeEvent
    | EncounterStartEvent
    | EncounterEndEvent
    | ChallengeModeStartEvent
    | ChallengeModeEndEvent;
