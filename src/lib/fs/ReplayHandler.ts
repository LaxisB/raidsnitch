import { wrapLog } from '@/lib/log';
import { Parser, WowEvent, createParser } from '@/lib/parser';
import { sleep } from '@/lib/utils';
import { BaseFileHandler } from './FileHandler';

const log = wrapLog('replay_handler');

// how often to emit cached events
const REPLAY_INTERVAL = 50;

// replay speed
let TIMESCALE = 10;

export class ReplayHandler extends BaseFileHandler {
    private readTime = 0;
    private parser!: Parser;
    private startTime = 0;
    private totalLines = 0;
    private readCount = 0;

    private cachedEvents: WowEvent[] = [];
    private emissionTargetTime = 0;
    private cachedEventsInterval: any = null;

    async handleFileChange(handle: FileSystemFileHandle) {
        const file = await handle.getFile();

        TIMESCALE = 10;

        this.readTime = Date.now();
        this.startTime = this.readTime;
        this.totalLines = 0;
        this.parser = createParser(file.lastModified);

        const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
        this.actions.debug.dbg({
                Name: file.name,
                'Size': Math.fround(file.size / (1024 * 1024)),
        })
        this.loopRead(file, reader);
        this.cachedEventsInterval = setInterval(() => this.emitCachedEvents(), REPLAY_INTERVAL);
    }

    async close() {
        await super.close();
        clearInterval(this.cachedEventsInterval);
    }

    private async loopRead(file: File, reader: ReadableStreamDefaultReader<string>) {
        const now = Date.now();

        if (this.cachedEvents.length >= 1000) {
            await sleep(250);
            this.readTime = now;
            this.schedule(() => this.loopRead(file, reader));
            return;
        }

        const { done, value } = await reader.read();

        this.readCount += value?.length ?? 0;
        const lines = this.readText(value);

        if (lines.length) {
            this.totalLines += lines.length;
            await this.handleLines(lines);
        }

        if (!done) {
            this.actions.debug.dbg({
                'Chunk Size': lines.length,
                'Line Parse Time (ms)': (Date.now() - now) / lines.length,
                Backlog: this.cachedEvents.length,
                Progress: ((this.readCount / file.size) * 100).toFixed(2) + '%',
            });
            this.readTime = now;
            this.schedule(() => this.loopRead(file, reader));
        } else {
            clearInterval(this.cachedEventsInterval);
            const total = Date.now() - this.startTime;
            this.actions.debug.dbg( {
                'Total Lines': this.totalLines,
                'Line Parse Time avg (ms)': total / this.totalLines,
                Backlog: this.cachedEvents.length,
                Progress: '100%',
            });
            log.log('Done reading file');
        }
    }

    private async handleLines(lines: string[]) {
        const res = lines.map((line) => this.parser.parseLine(line))
            .filter(x => !!x) as WowEvent[];
        this.cachedEvents.push(...res);
    }

    private emitCachedEvents() {
        if (this.doStop) {
            clearInterval(this.cachedEventsInterval);
            return;
        }
        if (!this.emissionTargetTime) {
            this.emissionTargetTime = this.cachedEvents[0].time;
        }

        let boundaryIndex = this.cachedEvents.findIndex((e) => e.time > this.emissionTargetTime);
        let spliceIndex = boundaryIndex === -1 ? this.cachedEvents.length : boundaryIndex;
        const toEmit = this.cachedEvents.splice(0, spliceIndex - 1);

        if (toEmit.some((e) => e.name === 'ENCOUNTER_START')) {
            TIMESCALE = 1;
        }
        if (toEmit.some((e) => e.name === 'ENCOUNTER_END')) {
            TIMESCALE = 10;
        }

        this.emissionTargetTime += REPLAY_INTERVAL * TIMESCALE;
        this.actions.debug.dbg( { 'Target Time': new Date(this.emissionTargetTime).toLocaleTimeString() });

        if (toEmit.length) {
            this.actions.debug.dbg({ Backlog: this.cachedEvents.length });
            this.emit(toEmit);
        }
    }
}
