const LIST_START = ['[', '('];
const LIST_END = [']', ')'];
const SEPARATORS = [',', ...LIST_START, ...LIST_END];

type LogBottomValues = null | number | string;
type LogValues = LogBottomValues | LogValues[];

export interface DataLine {
    time: 0;
    offset: number;
    event: string;
    payload: LogValues[];
    line: string;
}

export interface ErrorLine {
    time: 0;
    offset: number;
    event: null;
    payload: null;
    line: string;
}

export type LogLine = DataLine | ErrorLine;
export interface Parser {
    parseLine(line: string): LogLine;
}

export function createLineParser(referenceTime: number) {
    let reftime = referenceTime;
    let offset = 0;

    return {
        parseLine(line: string): LogLine {
            const [timeblock, rest] = line.split('  ');
            if (!timeblock || !rest) {
                return {
                    time: 0,
                    offset: offset++,
                    event: null,
                    payload: null,
                    line,
                } as ErrorLine;
            }

            const firstComma = rest.indexOf(',');
            const event = rest.slice(0, firstComma);
            const body = rest.slice(firstComma + 1);

            const time = parseTimeblock(timeblock, reftime);
            const payload = parsePayload(body);

            return {
                time,
                offset: offset++,
                event,
                payload,
                line,
            } as LogLine;
        },
    };
}

const TIMESTAMP_MATCHER = new RegExp(/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2}).(\d{1,3})/);
function parseTimeblock(timeBlock: string, reftime: number): number {
    const matches = TIMESTAMP_MATCHER.exec(timeBlock);
    const d = new Date(reftime);
    d.setMonth(parseInt(matches![1]) - 1);
    d.setDate(parseInt(matches![2]));
    d.setHours(parseInt(matches![3]));
    d.setMinutes(parseInt(matches![4]));
    d.setSeconds(parseInt(matches![5]));
    d.setMilliseconds(parseInt(matches![6]));
    return d.getTime();
}

function parsePayload(body: string) {
    const stack = makeStack();
    const payload = _parsePayload(body, stack);
    return payload as LogValues[];
}

function _parsePayload(rest: string, stack: Stack): any[] {
    // EOL :::: exit branch
    // this is the only
    // we're checking for length to avoid matching long strings
    if (!rest || (rest.length < 2 && /^\s*$/.test(rest))) {
        return stack.value();
    }

    // nil val
    if (rest.startsWith('nil')) {
        stack.addVal(null);
        return _parsePayload(rest.slice(4), stack);
    }

    // flags
    if (rest.startsWith('0x')) {
        const [val, rest2] = splitAtSeparator(rest);
        const flags = parseFlags(val);
        stack.addVal(flags);
        return _parsePayload(rest2, stack);
    }

    // quoted string
    if (rest.startsWith('"')) {
        // assume that the char following the closing quote is a separator
        // there is no precedent to indicate that this is not always the case
        const [val, rest2] = splitAtQuote(rest.slice(1));
        stack.addVal(val.slice(0, -1).trim());
        return _parsePayload(rest2, stack);
    }

    // lists
    if (LIST_START.includes(rest[0])) {
        stack.addLayer();
        return _parsePayload(rest.slice(1), stack);
    }
    if (LIST_END.includes(rest[0])) {
        stack.collapseLayer();
        // remove the separator and trailing comma
        const rest2 = rest.slice(1).replace(/^,/, '');
        return _parsePayload(rest2, stack);
    }

    // special case: a null guid
    if (rest.startsWith('0000000000000000')) {
        const [val, rest2] = splitAtSeparator(rest);
        stack.addVal(val);
        return _parsePayload(rest2, stack);
    }

    // value (int/float/const)
    const [val, rest2] = splitAtSeparator(rest);
    stack.addVal(parsePrimitive(val));
    return _parsePayload(rest2, stack);
}

/**
 * Parses a hex-formatted string of into an integer
 */
function parseFlags(flags: string) {
    if (!flags.startsWith('0x')) {
        return 0;
    }
    return Number.parseInt(flags.slice(2), 16);
}

function parsePrimitive(val: string) {
    const isNum = /^-?\d+(\.\d+)?$/.test(val);
    return isNum ? Number.parseFloat(val) : val;
}

function splitAtQuote(string: string) {
    const offset = string.indexOf('"');
    return [string.slice(0, offset + 1), string.slice(offset + 2)];
}

function splitAtSeparator(string: string) {
    const offsets = SEPARATORS.map((sep) => string.indexOf(sep)).filter((offset) => offset > -1);
    const min = Math.min(string.length, ...offsets);
    const val = string.slice(0, min);
    // trim leading comma if present. we don't need it for parsing
    const rest = string[min] === ',' ? string.slice(min + 1) : string.slice(min);
    return [val, rest];
}

interface Stack {
    addVal(val: any): void;
    addLayer(): void;
    collapseLayer(): void;
    value(): any[];
}

function makeStack(): Stack {
    const values: any[] = [[]];

    const head = () => values[values.length - 1];

    return {
        addVal(val: any) {
            head().push(val);
        },
        addLayer() {
            values.push([]);
        },
        collapseLayer() {
            const head = values.pop();
            values[values.length - 1].push(head);
        },

        value() {
            return values[0];
        },
    };
}
