import { formatFileSize } from '../lib/format';
import { wrapLog } from '../lib/log';
import { FileHandler } from './domain';
import { emitter } from './emitter';
import { Parser } from './parser';

const log = wrapLog('replay_handler');
export class ReplayHandler implements FileHandler {
    private readTime = 0;
    private partial = '';
    private parser!: Parser;
    private startTime = 0;
    private totalLines = 0;

    async handleFileChange(handle: FileSystemFileHandle) {
        const file = await handle.getFile();

        this.readTime = Date.now();
        this.startTime = this.readTime;
        this.totalLines = 0;
        this.parser = new Parser(file.lastModified);

        const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
        this.loopRead(file, reader);
    }

    private async loopRead(file: File, reader: ReadableStreamDefaultReader<string>) {
        const now = Date.now();
        const deltaTime = now - this.readTime;

        const { done, value } = await reader.read();

        this.partial += value ?? '';
        const lines = this.partial.split('\n');
        this.partial = lines.pop()!;

        if (lines.length) {
            this.totalLines += lines.length;
            await this.handleLines(lines);
        }
        emitter.emit('logDebug', {
            Name: file.name,
            Lines: lines.length,
            'Total Lines': this.totalLines,
            'Δ Time (ms)': deltaTime,
            'Line Parse Time (ms)': (Date.now() - this.readTime) / lines.length,
        });

        if (!done) {
            this.readTime = now;
            requestAnimationFrame(() => this.loopRead(file, reader));
        } else {
            const total = Date.now() - this.startTime;
            emitter.emit('logDebug', {
                Name: file.name,
                Size: formatFileSize(file.size),
                'Total Lines': this.totalLines,
                'Total Parse Time (ms)': total,
                'Line Parse Time (ms)': total / this.totalLines,
            });
            log.log('Done reading file');
        }
    }

    private async handleLines(lines: string[]) {
        const res = lines.map((line) => this.parser.parseLine(line));
        emitter.emit('logEvents', res);
        return res;
    }
}
