import { LogLine, Parser, createParser } from '@raidsnitch/logparser';
import { formatFileSize } from '@raidsnitch/shared/format';
import { wrapLog } from '@raidsnitch/shared/log';
import { sleep } from '@raidsnitch/shared/utils';
import { emitter } from '../../core/emitter';
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

    private cachedEvents: LogLine[] = [];
    private emissionTargetTime = 0;
    private cachedEventsInterval: any = null;

    async handleFileChange(handle: FileSystemFileHandle) {
        const file = await handle.getFile();

        TIMESCALE = 10;

        this.readTime = Date.now();
        this.startTime = this.readTime;
        this.totalLines = 0;
        this.parser = createParser(file.lastModified);
        emitter.emit('logDone', false);

        const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
        this.loopRead(file, reader);
        this.cachedEventsInterval = setInterval(() => this.emitCachedEvents(), REPLAY_INTERVAL);
    }

    async close() {
        await super.close();
        clearInterval(this.cachedEventsInterval);
    }

    private async loopRead(file: File, reader: ReadableStreamDefaultReader<string>) {
        const now = Date.now();
        const deltaTime = now - this.readTime;

        if (this.cachedEvents.length >= 1000) {
            await sleep(100);
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
            emitter.emit('logDebug', {
                Name: file.name,
                'Size (MiB)': Math.fround(file.size / (1024 * 1024)),
                Backlog: this.cachedEvents.length,
                Progress: ((this.readCount / file.size) * 100).toFixed(2) + '%',
                'Chunk Size': lines.length,
                'Δ Time (ms)': deltaTime,
                'Line Parse Time (ms)': (Date.now() - this.readTime) / lines.length,
            });
            this.readTime = now;
            this.schedule(() => this.loopRead(file, reader));
        } else {
            clearInterval(this.cachedEventsInterval);
            const total = Date.now() - this.startTime;
            emitter.emit('logDebug', {
                Name: file.name,
                Size: formatFileSize(file.size),
                Backlog: this.cachedEvents.length,
                Progress: '100%',
                'Total Lines': this.totalLines,
                'Wall Time (ms)': total,
                'Line Parse Time avg (ms)': total / this.totalLines,
            });
            emitter.emit('logDone', true);
            log.log('Done reading file');
        }
    }

    private async handleLines(lines: string[]) {
        const res = lines.map((line) => this.parser.parseLine(line));
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

        if (toEmit.some((e) => e.event === 'ENCOUNTER_START')) {
            TIMESCALE = 1;
        }
        if (toEmit.some((e) => e.event === 'ENCOUNTER_END')) {
            TIMESCALE = 10;
        }

        this.emissionTargetTime += REPLAY_INTERVAL * TIMESCALE;
        emitter.emit('logDebug', { 'Target Time': new Date(this.emissionTargetTime).toLocaleTimeString() });

        if (toEmit.length) {
            emitter.emit('logDebug', { Backlog: this.cachedEvents.length });
            this.emit(toEmit);
        }
    }
}
