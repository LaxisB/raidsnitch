import { formatFileSize } from '../format';
import { wrapLog } from '../log';
import { emitter } from '../../core/emitter';
import { Parser } from '../parser';
import { BaseFileHandler } from './FileHandler';

const log = wrapLog('replay_handler');
export class ReplayHandler extends BaseFileHandler {
    private readTime = 0;
    private parser!: Parser;
    private startTime = 0;
    private totalLines = 0;
    private readCount = 0;

    async handleFileChange(handle: FileSystemFileHandle) {
        const file = await handle.getFile();

        this.readTime = Date.now();
        this.startTime = this.readTime;
        this.totalLines = 0;
        this.parser = new Parser(file.lastModified);
        emitter.emit('logDone', false);

        const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
        this.loopRead(file, reader);
    }

    private async loopRead(file: File, reader: ReadableStreamDefaultReader<string>) {
        const now = Date.now();
        const deltaTime = now - this.readTime;

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
                Progress: ((this.readCount / file.size) * 100).toFixed(2) + '%',
                'Chunk Size': lines.length,
                'Δ Time (ms)': deltaTime,
                'Line Parse Time (ms)': (Date.now() - this.readTime) / lines.length,
            });
            this.readTime = now;
            this.schedule(() => this.loopRead(file, reader));
        } else {
            const total = Date.now() - this.startTime;
            emitter.emit('logDebug', {
                Name: file.name,
                Size: formatFileSize(file.size),
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
        emitter.emit('logEvents', res);
        return res;
    }
}
