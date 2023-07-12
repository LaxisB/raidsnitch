import { LogLine } from '@raidsnitch/logparser';
import { FileHandler } from '../../core/domain';

export class BaseFileHandler implements FileHandler {
    doStop = false;
    pendingLoop: number | undefined;

    partial = '';

    constructor(private handlerCb: (lines: LogLine[]) => void) {}

    readText(text?: string) {
        if (!text) {
            return [];
        }
        this.partial += text;
        const lines = this.partial.split(/\r?\n/);
        this.partial = lines.pop() ?? '';
        return lines;
    }

    async handleFileChange(handle: FileSystemFileHandle) {
        throw new Error('Method not implemented.');
    }
    async close() {
        this.doStop = true;
        if (this.pendingLoop) {
            cancelAnimationFrame(this.pendingLoop);
        }
    }

    schedule(fn: () => void) {
        this.pendingLoop = requestAnimationFrame(() => fn());
    }

    emit(lines?: LogLine[]) {
        if (!lines) {
            return;
        }

        this.handlerCb(lines);
    }
}
