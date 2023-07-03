// import { parse } from 'date-fns';
export class Parser {
    private offset = 0;

    private timeMatcher = new RegExp(/(\d{1,2})\/(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2}).(\d{1,3})/);

    constructor(private referenceTime: number) {}

    public parseLine(line: string) {
        const [timeblock, rest] = line.split('  ');

        const firstComma = rest.indexOf(',');
        const event = rest.slice(0, firstComma);
        const payload = rest.slice(firstComma + 1);

        const time = this.parseTime(timeblock);

        return {
            time,
            offset: this.offset++,
            event,
            payload,
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
}
