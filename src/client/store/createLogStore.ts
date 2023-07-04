import { batch } from 'solid-js';
import { LogStates } from '../../core/domain';
import { wrapLog } from '../../lib/log';
import type { ClientState, StoreEnhancer } from '../domain';
import { get } from 'idb-keyval';

export interface LogActions {
    refreshPermissions(): Promise<void>;
    watchFolder(): Promise<void>;
    openFile(): Promise<void>;
}
export interface LogState {
    state: LogStates;
    isReading: boolean;
    startTime: number;
    readTime: number;
    lines: string[];
    debug: Record<string, any[]>;
}

export const initialState: LogState = {
    state: LogStates.INITIAL,
    isReading: false,
    startTime: 0,
    readTime: 0,
    lines: [],
    debug: {},
};

export const createLogStore: StoreEnhancer = function (worker, actions, state, setState) {
    const log = wrapLog('log store');
    const refresh = async () => {
        const dirHandle = await get<FileSystemDirectoryHandle>('dirHandle');
        if (dirHandle) {
            await dirHandle.requestPermission();
        }
        return dirHandle;
    };
    actions.log = {
        refreshPermissions: async () => {
            const dirHandle = await refresh();
            if (dirHandle) {
                await worker.watchDirectory(dirHandle);
            }
        },
        watchFolder: async () => {
            let handle: FileSystemHandle | undefined;
            const supportsFS = 'showDirectoryPicker' in window;
            if (!supportsFS) {
                log.log("file picker isn't supported");
                return;
            }
            handle = await window.showDirectoryPicker();

            if (handle) {
                await worker.watchDirectory(handle as any);
            }
        },
        openFile: async () => {
            let handle: FileSystemHandle | undefined;
            const supportsFS = 'showDirectoryPicker' in window;
            if (!supportsFS) {
                log.log("file picker isn't supported");
                return;
            }
            [handle] = await window.showOpenFilePicker();

            if (handle) {
                setState('log', 'startTime', Date.now());
                setState('log', 'readTime', 0);
                await worker.readFile(handle as any);
            }
        },
    };

    worker.on('logEvents', (lines) => {
        log.debug('new log lines', lines);
        setState('log', 'readTime', Date.now() - state.log.startTime);
        setState('log', 'lines', lines);
    });
    worker.on('dirWatcherState', (state) => {
        log.debug('new fs state', state);
        setState('log', 'state', state);
    });
    worker.on('logDone', (done) => {
        setState('log', 'isReading', !done);
    });
    worker.on('logDebug', (debug) => {
        batch(() => {
            if (debug.clear) {
                Object.keys(state.log.debug).forEach((key) => {
                    if (key in debug == false) {
                        setState('log', 'debug', key, undefined as any);
                    }
                });
            }

            for (const key in debug) {
                setState('log', 'debug', key, (old) => {
                    if (!old) {
                        return [debug[key]];
                    }
                    return old.concat(debug[key]);
                });
            }
        });
    });
};
