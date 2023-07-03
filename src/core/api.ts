import { CoreInterface, FileHandler } from './domain';
import { DirWatcher } from './DirWatcher';
import { ReplayHandler } from './ReplayHandler';
import { LiveHandler } from './LiveHandler';

let dirWatcher: DirWatcher;

export const handlers: CoreInterface = {
    async restore() {
        if (!dirWatcher) {
            dirWatcher = new DirWatcher(new LiveHandler());
            // dirWatcher = new DirWatcher(new ReplayHandler());
        }
        await dirWatcher.restore();
    },

    async watchDirectory(handle: FileSystemDirectoryHandle) {
        if (!dirWatcher) {
            return Promise.reject({
                message: 'Not Initialized',
            });
        }
        dirWatcher.watchDirectory(handle);
    },
    async stop() {
        if (!dirWatcher) {
            return Promise.reject({
                message: 'Not Initialized',
            });
        }
        dirWatcher.stop();
    },
};
