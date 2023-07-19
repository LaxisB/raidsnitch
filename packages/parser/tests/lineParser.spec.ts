import { describe, it } from 'vitest';

import { createParser } from '../src';
import { createLineParser } from '../src/lineParser';
const raw = ``;
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
    } catch (e) {
      expect.fail(e.message);
    }
  });
});

describe('parser', () => {
  it('parses advanced params', async ({ expect }) => {
    const line =
      '7/16 15:47:57.649  SPELL_DAMAGE_SUPPORT,Player-3686-0A037075,"Montezooma-Antonidas",0x512,0x0,Creature-0-4243-2520-16265-189299-000A33F254,"Decaying Slime",0xa48,0x10,395152,"Ebon Might",0xc,Creature-0-4243-2520-16265-189299-000A33F254,0000000000000000,1058555,1252000,0,0,5043,0,1,0,0,0,-3374.40,4189.57,2096,4.3295,70,4349,2817,-1,1,0,0,0,1,nil,nil,Player-3692-0A0141BE';
    const parser = createParser(0);
    const res = parser.parseLine(line);
    expect(res).toMatchSnapshot();
  });
});
