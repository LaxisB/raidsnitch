import { parseAsEvent } from './events/parser';
import { createLineParser } from './lineParser';

export type * from './events';
export { casts } from './events';

export type Parser = ReturnType<typeof createParser>;

export function createParser(referenceTime: number) {
  const lineParser = createLineParser(referenceTime);

  function parseLine(line: string) {
    const logLine = lineParser.parseLine(line);
    if (logLine.event === null) {
      return null;
    }
    return parseAsEvent(logLine, referenceTime);
  }

  return {
    parseLine,
  };
}
