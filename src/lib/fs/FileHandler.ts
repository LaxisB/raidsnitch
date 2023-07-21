import { WowEvent } from '@/lib/parser';
import { Actions } from '../../client/domain';
import { FileHandler } from './domain';


export class BaseFileHandler implements FileHandler {
    doStop = false;
    pendingLoop: number |undefined;

    partial = '';

    constructor(protected actions: Actions) {}



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

    emit(lines?: WowEvent[]) {
        if (!lines) {
            return;
        }

        this.actions.snitch.handleEvents(lines);
    }
}
