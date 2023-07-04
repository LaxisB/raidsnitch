import { formatFileSize } from '../../lib/format';
import { wrapLog } from '../../lib/log';
import { Parser } from '../../lib/parser';
import { sleep } from '../../lib/utils';
import { FileHandler } from '../domain';
import { emitter } from '../emitter';

const log = wrapLog('live_log_handler');

export class LiveHandler implements FileHandler {
    private handle!: FileSystemFileHandle;
    private offset = 0;
    private logReader!: ReturnType<typeof createReader>;

    private readTime = 0;
    private partial = '';
    private parser!: Parser;
    private startTime = 0;
    private totalLines = 0;
    private noDataReadCount = 0;

    async handleFileChange(handle: FileSystemFileHandle) {
        const file = await handle.getFile();
        if (!handle) {
            return;
        }
        this.offset = 0;
        this.partial = '';
        this.handle = handle;
        this.readTime = Date.now();
        this.startTime = this.readTime;
        this.parser = new Parser(file.lastModified);
        this.loopRead();
    }

    private async loopRead() {
        const file = await this.handle!.getFile();

        const now = Date.now();
        const deltaTime = now - this.readTime;
        if (file.size < this.offset) {
            log.error("fatal error: file size is smaller than offset, can't recover");
            throw new Error('File size is smaller than offset');
        }

        if (file.size == this.offset) {
            this.noDataReadCount = Math.max(10, this.noDataReadCount + 1);
            log.debug('No new data');

            // exponential backoff from 2 -> 1024 ms
            const timeout = 2 ** this.noDataReadCount;
            setTimeout(() => this.loopRead(), timeout);
            return;
        }

        this.noDataReadCount = 0;
        this.partial += await file.slice(this.offset).text();
        const lines = this.partial.split(/\r?\n/);
        this.partial = lines.pop() ?? '';

        if (lines.length) {
            this.totalLines += lines.length;
            await this.handleLines(lines);
        }

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

        requestAnimationFrame(() => this.loopRead());
    }

    async handleLines(lines: string[]) {
        const events = lines.map((line) => this.parser.parseLine(line));
        emitter.emit('logEvents', events);
        return events;
    }
}
