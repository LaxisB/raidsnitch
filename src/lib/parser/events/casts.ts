import {
    ChallengeModeEndEvent,
    ChallengeModeStartEvent,
    CombatLogVersionEvent,
    EncounterEndEvent,
    EncounterStartEvent,
    MapChangeEvent,
    WorldMarkerPlacedEvent,
    WorldMarkerRemovedEvent,
    WowEvent,
    ZoneChangeEvent,
} from './domain';

export function eventIsCombatLogVersion(event: WowEvent): event is CombatLogVersionEvent {
    return event.name === 'COMBAT_LOG_VERSION';
}
export function eventIsZoneChange(event: WowEvent): event is ZoneChangeEvent {
    return event.name === 'ZONE_CHANGE';
}
export function eventIsMapChange(event: WowEvent): event is MapChangeEvent {
    return event.name === 'MAP_CHANGE';
}
export function eventIsWorldMarkerPlaced(event: WowEvent): event is WorldMarkerPlacedEvent {
    return event.name === 'WORLD_MARKER_PLACED';
}
export function eventIsWorldMarkerRemoved(event: WowEvent): event is WorldMarkerRemovedEvent {
    return event.name === 'WORLD_MARKER_REMOVED';
}
export function eventIsEncounterStart(event: WowEvent): event is EncounterStartEvent {
    return event.name === 'ENCOUNTER_START';
}
export function eventIsEncounterEnd(event: WowEvent): event is EncounterEndEvent {
    return event.name === 'ENCOUNTER_END';
}
export function eventIsChallengeModeStart(event: WowEvent): event is ChallengeModeStartEvent {
    return event.name === 'CHALLENGE_MODE_START';
}
export function eventIsChallengeModeEnd(event: WowEvent): event is ChallengeModeEndEvent {
    return event.name === 'CHALLENGE_MODE_END';
}
