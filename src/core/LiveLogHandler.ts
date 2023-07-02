import { formatFileSize } from '../lib/format';
import { wrapLog } from '../lib/log';
import { FileHandler } from './domain';
import { emitter } from './emitter';

const log = wrapLog('live_log_handler');

export class LiveLogHandler implements FileHandler {
    private handle: FileSystemFileHandle | null = null;
    private offset = 0;
    private lastReadTimestamp = Date.now();

    async handleFileChange(newHandle: FileSystemFileHandle) {
        this.handle = newHandle;
        this.offset = 0;
        this.debugFileStats();
        this.watch();
    }

    private async watch() {
        if (!this.handle) {
            return;
        }
        const file = await this.handle.getFile();

        this.loopGetFileSize();
    }

    private async loopGetFileSize(prev?: number) {
        if (!this.handle) {
            return;
        }
        const now = Date.now();
        const deltaTime = Math.max(now, this.lastReadTimestamp) - Math.min(now, this.lastReadTimestamp);
        const f = await this.handle.getFile();
        if (f.size != prev) {
            console.log(deltaTime);
            emitter.emit('fsDebug', {
                Name: f.name,
                'Size (MiB)': Math.fround(f.size / (1024 * 1024)),
                'Δ Size (KiB)': Math.fround((f.size - this.offset) / 1024),
                'Δ Time (ms)': deltaTime,
                'Last Modified': `${new Date(f.lastModified).toLocaleString()}`,
            });
            this.lastReadTimestamp = now;
            this.offset = f.size;
        }

        setTimeout(() => this.loopGetFileSize(f.size), Math.min(deltaTime, 50));
    }

    private async debugFileStats() {
        if (!this.handle) {
            return;
        }
        const f = await this.handle.getFile();
    }
}
