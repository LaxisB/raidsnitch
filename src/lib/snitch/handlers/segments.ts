import { WowEvent, casts } from '@/lib/parser';
import type { State } from '..';
import { CreateHandler } from './domain';

export interface Segment {
    id: string;
    active: boolean;
    startTime: number;
    duration?: number;
    name: string;
    success?: number;
    combatantGuids: string[];
}

interface EncounterSegment extends Segment {
    type: 'encounter';
    difficultyId: number;
    raidSize: number;
}
interface ChallengeSegment extends Segment {
    type: 'challenge';
    level: number;
    affixes: any[];
}

type SegmentType = EncounterSegment | ChallengeSegment;

export interface SegmentState {
    byId: Record<string, SegmentType>;
    ids: string[];
    active: { encounter: string | null; challenge: string | null };
}

export const createSegmentHandler: CreateHandler<SegmentState> = () => {
    let idCounter = 0;
    let initialState: SegmentState = {
        byId: {},
        ids: [],
        active: { encounter: null, challenge: null },
    };

    function handleEvent(event: WowEvent, state: State) {
        if (casts.eventIsZoneChange(event)) {
            if (state.segments.active.encounter) {
                const segment = state.segments.byId[state.segments.active.encounter] as EncounterSegment;
                if (!segment) {
                    return;
                }
                segment.active = false;
                segment.duration = event.time - segment.startTime;
                state.segments.active.encounter = null;
            }
            if (state.segments.active.challenge) {
                const segment = state.segments.byId[state.segments.active.challenge] as ChallengeSegment;
                if (!segment) {
                    return;
                }
                segment.active = false;
                segment.duration = event.time - segment.startTime;
                state.segments.active.challenge = null;
            }
        }

        if (casts.eventIsEncounterStart(event)) {
            const segment = {
                active: true,
                type: 'encounter',
                id: (idCounter++).toString(),
                name: event.untyped[1],
                difficultyId: event.untyped[2],
                raidSize: event.untyped[3],
                startTime: event.time,
                combatantGuids: [],
            } as EncounterSegment;
            state.segments.byId[segment.id] = segment;
            state.segments.ids.push(segment.id);
            state.segments.active.encounter = segment.id;
        }
        if (casts.eventIsEncounterEnd(event)) {
            if (state.segments.active.encounter == null) {
                return;
            }
            const segment = state.segments.byId[state.segments.active.encounter] as EncounterSegment;
            if (!segment) {
                return;
            }
            segment.active = false;
            segment.success = event.untyped[4];
            segment.duration = event.untyped[5];
            state.segments.active.encounter = null;
        }

        if (casts.eventIsChallengeModeStart(event)) {
            const segment = {
                active: true,
                type: 'challenge',
                id: (idCounter++).toString(),
                startTime: event.time,
                name: event.untyped[0],
                level: event.untyped[3],
                affixes: event.untyped[4] as any,
                combatantGuids: [],
            } as ChallengeSegment;
            state.segments.byId[segment.id] = segment;
            state.segments.ids.push(segment.id);
            state.segments.active.challenge = segment.id;
        }

        if (casts.eventIsChallengeModeEnd(event)) {
            if (state.segments.active.challenge == null) {
                return;
            }
            const segment = state.segments.byId[state.segments.active.challenge] as ChallengeSegment;
            if (!segment) {
                return;
            }
            segment.active = false;
            segment.duration = event.untyped[3];
            segment.success = event.untyped[1];
            state.segments.active.challenge = null;
        }

        if (event.name === 'COMBATANT_INFO') {
            if (state.segments.active.encounter) {
                state.segments.byId[state.segments.active.encounter].combatantGuids.push((event as any).untyped[0]);
            }
            if (state.segments.active.challenge) {
                const segment = state.segments.byId[state.segments.active.challenge];
                if (!segment.combatantGuids.includes((event as any).untyped[0])) {
                    segment.combatantGuids.push((event as any).untyped[0]);
                }
            }
        }
    }

    return {
        initialState,
        handleEvent,
    };
};
