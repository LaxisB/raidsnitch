import { emitter } from '../../core/emitter';
import { LogLine } from '@raidsnitch/logparser';
import { parser } from './events';
import { createDpsHandler } from './handlers/dps';
import { createEncounterHandler } from './handlers/encounter';
import { createEntitiesHandler } from './handlers/entities';
import { createZoneHandler } from './handlers/zone';

export type State = ReturnType<typeof initialize>['state'];
export interface Snitch {
    state: State;
    handleEvents(events: LogLine[]): void;
}

export function initialize() {
    let refTime = -1;
    const encounters = createEncounterHandler();
    const zone = createZoneHandler();
    const entities = createEntitiesHandler();
    const dps = createDpsHandler();

    let state = {
        encounter: encounters.initialState,
        zone: zone.initialState,
        entities: entities.initialState,
        dps: dps.initialState,
    };

    const handlers = [encounters.handleEvent, zone.handleEvent, entities.handleEvent, dps.handleEvent];

    function handleEvents(events: LogLine[]) {
        events.forEach((line) => {
            if (!line.event) return;
            if (refTime === -1) {
                refTime = line.time;
            }
            const parsed = parser.parseAsEvent(line, refTime);
            handlers.forEach((handler) => handler(parsed, state));
        });

        emitter.emit('stats', state);
    }
    return {
        state,
        handleEvents,
    };
}
