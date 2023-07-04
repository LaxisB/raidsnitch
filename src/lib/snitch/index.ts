import { emitter } from '../../core/emitter';
import { LogLine } from '../parser';
import { LogEvent } from './domain';

interface Stats {
    time: string;
    zone: string;
    mplus: null | {
        zoneName: string;
        keyStoneLevel: number;
        affixes: string[];
        totalTime: number;
        success: number;
    };
    encounter: {
        name: string;
        difficulty: number;
        groupSize: number;
        fightTime: number;
        success: number;
    };
}

export function initialize() {
    const stats: Stats = {
        time: '',
        zone: '',
        mplus: null,
        encounter: {
            name: '',
            difficulty: 0,
            groupSize: 0,
            fightTime: 0,
            success: -1,
        },
    };

    let handlers: ((events: LogEvent, statsRef: typeof stats) => void)[] = [
        time,
        currentZone,
        encounter,
        challengeMode,
    ];

    return function handleEvents(events: LogLine[]) {
        events.forEach((event) => {
            if (!event.event) return;
            handlers.forEach((handler) => handler(event, stats));
        });

        emitter.emit('stats', stats);
    };
}

function time(event: LogLine, stats: Stats) {
    if (event.event) {
        stats.time = new Date(event.time).toLocaleTimeString();
    }
}
function currentZone(event: LogLine, stats: Stats) {
    if (event.event === 'ZONE_CHANGE') {
        stats.zone = event.payload[1];
    }
}

function encounter(event: LogEvent, stats: Stats) {
    if (event.event === 'ENCOUNTER_START') {
        const [encounterId, name, difficulty, groupSize, instanceId] = event.payload;
        stats.encounter = {
            name,
            difficulty,
            groupSize,
            fightTime: 0,
            success: -1,
        };
    }
    if (event.event === 'ENCOUNTER_END') {
        const [encounterId, name, difficulty, groupSize, success, fightTime] = event.payload;
        stats.encounter = {
            name,
            difficulty,
            groupSize,
            fightTime,
            success,
        };
    }
}
function challengeMode(event: LogEvent, stats: Stats) {
    if (event.event === 'CHALLENGE_MODE_START') {
        const [zoneName, instanceId, challengeModeId, keyStoneLevel, ...affixes] = event.payload;
        stats.mplus = {
            zoneName,
            keyStoneLevel,
            affixes,
            totalTime: 0,
            success: -1,
        };
    }
    if (event.event === 'CHALLENGE_MODE_END') {
        const [instanceId, success, keyStoneLevel, totalTime] = event.payload;
        stats.mplus = {
            affixes: [],
            zoneName: '',
            ...(stats.mplus ?? {}),
            success,
            keyStoneLevel,
            totalTime,
        };
    }
}
