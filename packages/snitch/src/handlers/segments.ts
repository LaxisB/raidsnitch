import { WowEvent, casts } from '@raidsnitch/parser';
import type { State } from '..';
import { CreateHandler } from './domain';

interface Segment {
  id: string;
  active: boolean;
  startTime: number;
  endTime?: number;
  name: string;
  success?: number;
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

export interface SegmentState {
  byId: Record<string, Segment>;
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
    if (casts.eventIsEncounterStart(event)) {
      const segment = {
        active: true,
        type: 'encounter',
        id: (idCounter++).toString(),
        name: event.untyped[1],
        difficultyId: event.untyped[2],
        raidSize: event.untyped[3],
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
      segment.endTime = event.time;
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
      segment.endTime = event.time;
    }
  }

  return {
    initialState,
    handleEvent,
  };
};
