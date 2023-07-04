import { CoreInterface, LogStates } from './domain';
import { DirWatcher } from '../lib/fs/DirWatcher';
import { ReplayHandler } from '../lib/fs/ReplayHandler';
import { LiveHandler } from '../lib/fs/LiveHandler';
import { emitter } from './emitter';
import { dir } from 'console';

let dirWatcher: DirWatcher | null = null;
let fileWatcher: ReplayHandler | null = null;

export const handlers: CoreInterface = {
    async restore() {
        if (!dirWatcher) {
            dirWatcher = new DirWatcher(new LiveHandler());
        }
        await dirWatcher.restore();
    },

    async watchDirectory(handle: FileSystemDirectoryHandle) {
        if (fileWatcher) {
            fileWatcher.close();
            fileWatcher = null;
        }

        if (!dirWatcher) {
            dirWatcher = new DirWatcher(new LiveHandler());
        }
        dirWatcher.watchDirectory(handle);
    },
    async readFile(handle: FileSystemFileHandle) {
        if (dirWatcher) {
            dirWatcher.close();
            dirWatcher = null;
        }
        const handler = new ReplayHandler();
        emitter.emit('dirWatcherState', LogStates.HAS_FILE);
        handler.handleFileChange(handle);
    },
    async stop() {
        if (!dirWatcher) {
            return Promise.reject({
                message: 'Not Initialized',
            });
        }
        dirWatcher.close();
    },
};
