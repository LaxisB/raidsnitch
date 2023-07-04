import { wrapLog } from '../log';
import { Parser } from '../parser';
import { sleep } from '../utils';
import { emitter } from '../../core/emitter';
import { BaseFileHandler } from './FileHandler';

const log = wrapLog('live_log_handler');

export class LiveHandler extends BaseFileHandler {
    private handle!: FileSystemFileHandle;
    private offset = 0;

    private readTime = 0;
    private parser!: Parser;
    private totalLines = 0;
    private noDataReadCount = 0;

    async handleFileChange(handle: FileSystemFileHandle) {
        const file = await handle.getFile();
        if (!handle) {
            return;
        }
        log.log('handle change', handle.name);
        this.offset = 0;
        this.handle = handle;
        this.readTime = Date.now();
        this.parser = new Parser(file.lastModified);
        this.loopRead();
    }

    private async loopRead() {
        if (this.doStop) {
            return;
        }
        const file = await this.handle!.getFile();

        const now = Date.now();
        const deltaTime = now - this.readTime;
        if (file.size < this.offset) {
            log.error("fatal error: file size is smaller than offset, can't recover");
            throw new Error('File size is smaller than offset');
        }

        if (file.size == this.offset) {
            this.noDataReadCount = Math.min(10, this.noDataReadCount + 1);
            const timeout = this.noDataReadCount < 5 ? 100 : 100 * this.noDataReadCount;
            await sleep(timeout);
            this.schedule(() => this.loopRead());
            return;
        }

        this.noDataReadCount = 0;
        const lines = this.readText(await file.slice(this.offset).text());

        this.totalLines += lines.length;
        await this.handleLines(lines);

        emitter.emit('logDebug', {
            Name: file.name,
            'Size (MiB)': Math.fround(file.size / (1024 * 1024)),
            'Chunk Size': lines.length,
            'Δ Size (KiB)': Math.fround((file.size - this.offset) / 1024),
            'Δ Time (ms)': deltaTime,
            'Line Parse Time (ms)': (Date.now() - this.readTime) / lines.length,
            'Last Modified': `${new Date(file.lastModified).toLocaleString()}`,
        });

        this.readTime = now;
        this.offset = file.size;

        this.schedule(() => this.loopRead());
    }

    async handleLines(lines: string[]) {
        const events = lines.map((line) => this.parser.parseLine(line));
        emitter.emit('logEvents', events);
        return events;
    }
}
