export enum EventName {
  COMBAT_LOG_VERSION = 'COMBAT_LOG_VERSION',
  ZONE_CHANGE = 'ZONE_CHANGE',
  MAP_CHANGE = 'MAP_CHANGE',
  WORLD_MARKER_PLACED = 'WORLD_MARKER_PLACED',
  WORLD_MARKER_REMOVED = 'WORLD_MARKER_REMOVED',
  ENCOUNTER_START = 'ENCOUNTER_START',
  ENCOUNTER_END = 'ENCOUNTER_END',
  CHALLENGE_MODE_START = 'CHALLENGE_MODE_START',
  CHALLENGE_MODE_END = 'CHALLENGE_MODE_END',
  ENVIRONMENTAL = 'ENVIRONMENTAL',
  COMBATANT_INFO = 'COMBATANT_INFO',
  EMOTE = 'EMOTE',
}
export enum RaidMarker {
  STAR = 0,
  CIRCLE = 1,
  DIAMOND = 2,
  TRIANGLE = 3,
  MOON = 4,
  SQUARE = 5,
  CROSS = 6,
  SKULL = 7,
}

export interface EventBaseParams {
  sourceGuid: string;
  sourceName: string;
  sourceFlags: number;
  sourceRaidFlags: number;
  destGuid: string;
  destName: string;
  destFlags: number;
  destRaidFlags: number;
}

export interface AdvancedParams {
  infoGuid: string;
  ownerGuid: string;
  currentHp: number;
  maxHp: number;
  attackPower: number;
  spellPower: number;
  armor: number;
  absorb: number;
  powerType: number;
  currentPower: number;
  maxPower: number;
  powerCost: number;
  positionX: number;
  positionY: number;
  uiMapId: number;
  facing: number;
  level: number;
}

export interface BaseEvent {
  readonly time: number;
  readonly deltaTime: number;
  readonly name: string;
}
export interface GlobalEvent extends BaseEvent {
  untyped: any[];
}
export interface EntityEvent extends BaseEvent {
  baseParams: EventBaseParams;
  prefixes: any[];
  advanced?: AdvancedParams;
  suffixes: any[];
}

export interface CombatLogVersionEvent extends GlobalEvent {
  name: 'COMBAT_LOG_VERSION';
  untyped: [
    version: number,
    labelAdvancedLog: string,
    advancedLogEnabled: boolean,
    labelBuildVersion: string,
    buildVersion: number,
    labelProjectId: string,
    projectId: number,
  ];
}

export interface ZoneChangeEvent extends GlobalEvent {
  name: 'ZONE_CHANGE';
  untyped: [zoneId: number, zoneName: string, difficulty: number];
}

export interface MapChangeEvent extends GlobalEvent {
  name: 'MAP_CHANGE';
  untyped: [mapId: number, mapName: string, x1: number, x1: number, y1: number, y2: number];
}
export interface WorldMarkerPlacedEvent extends GlobalEvent {
  name: 'WORLD_MARKER_PLACED';
  untyped: [instanceId: number, markerType: RaidMarker, x: number, y: number];
}
export interface WorldMarkerRemovedEvent extends GlobalEvent {
  name: 'WORLD_MARKER_REMOVED';
  untyped: [markerType: RaidMarker];
}

export interface EncounterStartEvent extends GlobalEvent {
  name: 'ENCOUNTER_START';
  untyped: [encounterId: number, encounterName: string, difficultyId: number, raidSize: number, instanceId: number];
}

export interface EncounterEndEvent extends GlobalEvent {
  name: 'ENCOUNTER_END';
  untyped: [
    encounterId: number,
    encounterName: string,
    difficultyId: number,
    raidSize: number,
    instanceId: number,
    encounterSuccess: number,
    fightTime: number,
  ];
}
export interface ChallengeModeStartEvent extends GlobalEvent {
  name: 'CHALLENGE_MODE_START';
  untyped: [zoneName: string, instanceId: number, challengeModeId: number, keystoneLevel: number, ...affixId: number[]];
}
export interface ChallengeModeEndEvent extends GlobalEvent {
  name: 'CHALLENGE_MODE_END';
  untyped: [instanceId: number, success: number, keystoneLevel: number, totalTime: number];
}

export type GlobalEvents =
  | CombatLogVersionEvent
  | ZoneChangeEvent
  | MapChangeEvent
  | WorldMarkerPlacedEvent
  | WorldMarkerRemovedEvent
  | EncounterStartEvent
  | EncounterEndEvent
  | ChallengeModeStartEvent
  | ChallengeModeEndEvent;

export type WowEvent = GlobalEvents | EntityEvent;
