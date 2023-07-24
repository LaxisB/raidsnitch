import { beforeEach, describe, expect, it } from 'vitest';

import { createLineParser } from './lineParser';

describe('lineParser', () => {
    let parser!: ReturnType<typeof createLineParser>;

    beforeEach(() => {
        parser = createLineParser(Date.now());
    });

    it('can be constructed', () => {
        expect(() => createLineParser(0)).not.toThrow();
    });

    it('returns event format even on non-combatlog format', () => {
        const line = 'this is not a combat log';
        const parsed = parser.parseLine(line);
        expect(parsed.time).toBeDefined();
        expect(parsed.offset).toBeDefined();
        expect(parsed.payload).toBe(null);
        expect(parsed.line).toBe(line);
    });

    it('parses preamble', () => {
        const line = '7/23 20:37:46.809  EVENT,';
        const parsed = parser.parseLine(line);
        const currentYear = new Date().getFullYear();
        expect(parsed.time).toBe(new Date(`${currentYear}-07-23T20:37:46.809`).getTime());
        expect(parsed).toMatchObject({
            event: 'EVENT',
            payload: [],
            line: line,
        });
    });
    it('parses quoted strings', () => {
        const line = '7/23 20:37:46.809  EVENT,"Brackenhide Hollow"';
        const parsed = parser.parseLine(line);
        expect(parsed.payload).toMatchObject(['Brackenhide Hollow']);
    });
    it('parses integers', () => {
        const line = '7/23 20:37:46.809  EVENT,123';
        const parsed = parser.parseLine(line);
        expect(parsed.payload).toMatchObject([123]);
    });

    it('handles multiline items', () => {
        const line =
            '7/23 20:51:17.100  EMOTE,Vehicle-0-3891-2520-4388-186120-00003D73E6,"Treemouth",0000000000000000,nil,|TInterface\\ICONS\\Spell_Nature_StrangleVines.blp:20|t Treemouth draws everyone in closer. \r\nEveryone within 10 yards will be consumed!';

        let parsed;
        expect(() => (parsed = parser.parseLine(line))).not.toThrow();
        expect(parsed).toBeDefined();
        expect(parsed!.event).toBe('EMOTE');

        expect(parsed!.payload).toMatchObject([
            'Vehicle-0-3891-2520-4388-186120-00003D73E6',
            'Treemouth',
            '0000000000000000',
            null,
            '|TInterface\\ICONS\\Spell_Nature_StrangleVines.blp:20|t Treemouth draws everyone in closer. \r\nEveryone within 10 yards will be consumed!',
        ]);
    });
});
