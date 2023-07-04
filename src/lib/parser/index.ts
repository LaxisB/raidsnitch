import { Stack } from './Stack';

const LIST_START = ['[', '('];
const LIST_END = [']', ')'];
const SEPARATORS = [',', ...LIST_START, ...LIST_END];

type LogBottomValues = null | number | string;
type LogValues = LogBottomValues | LogValues[];

export class Parser {
    private offset = 0;

    // regex to match blizz's timestamp format of MM/DD HH:MM:SS.sss
    private timeMatcher = new RegExp(/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2}).(\d{1,3})/);

    // needs referenceTime to complete timestamps
    // this approach fails, when logging across a year boundary
    // but that's sad enough already so it doesn't matter if this breaks as well
    constructor(private referenceTime: number) {}

    public parseLine(line: string) {
        const [timeblock, rest] = line.split('  ');
        if (!timeblock || !rest)
            return {
                time: 0,
                offset: this.offset++,
                event: null,
                payload: null,
                line,
            };

        const firstComma = rest.indexOf(',');
        const event = rest.slice(0, firstComma);
        const body = rest.slice(firstComma + 1);

        const time = this.parseTime(timeblock);

        const payload = this.parsePayload(body);

        return {
            time,
            offset: this.offset++,
            event,
            payload,
            line,
        };
    }

    private parseTime(timeBlock: string) {
        const matches = this.timeMatcher.exec(timeBlock);
        const d = new Date(this.referenceTime);
        d.setMonth(parseInt(matches![1]) - 1);
        d.setDate(parseInt(matches![2]));
        d.setHours(parseInt(matches![3]));
        d.setMinutes(parseInt(matches![4]));
        d.setSeconds(parseInt(matches![5]));
        d.setMilliseconds(parseInt(matches![6]));
        return d.getTime();
    }

    private parsePayload(body: string) {
        const stack = new Stack();
        const payload = this._parsePayload(body, stack);
        return payload as LogValues;
    }
    private _parsePayload(rest: string, stack: Stack): any[] {
        // EOL :::: exit branch
        // this is the only
        // we're checking for length to avoid matching long strings
        if (!rest || (rest.length < 2 && /\w*/.test(rest))) {
            return stack.value;
        }
        // nil val
        if (rest.startsWith('nil')) {
            stack.pushValue(null);
            return this._parsePayload(rest.slice(3), stack);
        }
        // flags
        if (rest.startsWith('0x')) {
            const [val, rest2] = this.splitAtSeparator(rest);
            const flags = this.parseFlags(val);
            stack.pushValue(flags);
            return this._parsePayload(rest2, stack);
        }
        // quoted string
        if (rest.startsWith('"')) {
            // assume that the char following the closing quote is a separator
            // there is no precedent to indicate that this is not always the case
            const [val, rest2] = this.splitAtSeparator(rest.slice(1));
            stack.pushValue(val.slice(0, -1).trim());
            return this._parsePayload(rest2, stack);
        }
        // lists
        if (LIST_START.includes(rest[0])) {
            stack.addLayer();
            return this._parsePayload(rest.slice(1), stack);
        }
        if (LIST_END.includes(rest[0])) {
            const val = stack.popLayer();
            stack.pushValue(val);
            // remove the separator and trailing comma
            const rest2 = rest.slice(1).replace(/^,/, '');
            return this._parsePayload(rest2, stack);
        }
        // value (int/float/const)
        const [val, rest2] = this.splitAtSeparator(rest);
        stack.pushValue(val.trim());
        return this._parsePayload(rest2, stack);
    }

    /**
     * Parses a hex-formatted string of into an integer
     */
    private parseFlags(flags: string) {
        if (!flags.startsWith('0x')) {
            return 0;
        }
        return Number.parseInt(flags.slice(2), 16);
    }

    splitAtSeparator(string: string) {
        const offsets = SEPARATORS.map((sep) => string.indexOf(sep)).filter((offset) => offset > -1);
        const min = Math.min(...offsets);
        const val = string.slice(0, min);
        // trim leading comma if present. we don't need it for parsing
        const rest = string[min] === ',' ? string.slice(min + 1) : string.slice(min);
        return [val, rest];
    }
}
