import { CoreInterface, FileHandler } from './domain';
import { DirWatcher } from './DirWatcher';
import { LiveLogHandler } from './LiveLogHandler';

let dirWatcher: DirWatcher;
let logHandler: FileHandler;

export const handlers: CoreInterface = {
    async restore() {
        if (!dirWatcher) {
            dirWatcher = new DirWatcher(new LiveLogHandler());
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
