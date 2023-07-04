import { CoreInterface, LogStates } from './domain';
import { DirWatcher } from '../lib/fs/DirWatcher';
import { ReplayHandler } from '../lib/fs/ReplayHandler';
import { LiveHandler } from '../lib/fs/LiveHandler';
import { emitter } from './emitter';
import { initialize as initializeSnitch } from '../lib/snitch';

let dirWatcher: DirWatcher | null = null;
let fileWatcher: ReplayHandler | null = null;
let snitch: any = null;

function reset() {
    dirWatcher?.close();
    fileWatcher?.close();
    dirWatcher = null;
    fileWatcher = null;
    snitch = initializeSnitch();
}

export const handlers: CoreInterface = {
    async restore() {
        reset();
        dirWatcher = new DirWatcher(new LiveHandler(snitch));
        await dirWatcher.restore();
    },

    async watchDirectory(handle: FileSystemDirectoryHandle) {
        reset();

        dirWatcher = new DirWatcher(new LiveHandler(snitch));
        dirWatcher.watchDirectory(handle);
    },
    async readFile(handle: FileSystemFileHandle) {
        reset();
        fileWatcher = new ReplayHandler(snitch);
        emitter.emit('dirWatcherState', LogStates.HAS_FILE);
        fileWatcher.handleFileChange(handle);
    },
    async stop() {
        dirWatcher?.close();
        fileWatcher?.close();
        reset();
        return 'ok';
    },
};
