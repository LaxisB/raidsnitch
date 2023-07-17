import { readFile } from 'fs/promises';
import { describe, it } from 'vitest';
import { createLineParser } from '../src/lineParser';
const raw = await readFile('D:\\Games\\World of Warcraft\\_retail_\\Logs\\WoWCombatLog-071623_150358.txt', 'utf8');
const lines = raw.split('\n');
describe('lineParser', () => {
    it('should be defined', ({ expect }) => {
        expect(true).toBe(true);
    });
    it('parses data', async ({ expect }) => {
        const parser = createLineParser(0);
        const res = parser.parseLine('7/1 19:58:19.733  COMBAT_LOG_VERSION,20,ADVANCED_LOG_ENABLED,1,BUILD_VERSION,10.1.0,PROJECT_ID,1');
        expect(res).toMatchSnapshot();
    });
    it('does not throw', async ({ expect }) => {
        try {
            const parser = createLineParser(0);
            lines.forEach((line) => {
                parser.parseLine(line);
            });
        }
        catch (e) {
            expect.fail(e.message);
        }
    });
});
