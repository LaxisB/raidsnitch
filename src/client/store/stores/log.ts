import { createFileReader } from '@/lib/fs/fs';
import { wrapLog } from '@/lib/log';
import { useNavigate } from '@solidjs/router';
import { get, set } from 'idb-keyval';
import { batch } from 'solid-js';
import { SetStoreFunction } from 'solid-js/store';
import { DirWatcher } from '../../../lib/fs/DirWatcher';
import { LiveHandler } from '../../../lib/fs/LiveHandler';
import { ReplayHandler } from '../../../lib/fs/ReplayHandler';
import type { Actions, State, StoreEnhancer } from '../../domain';

createFileReader;
export interface LogActions {
    restore(): Promise<void>;
    reset(): void;
    watch(): Promise<void>;
    replay(): Promise<void>;
    stop(): Promise<void>;
}
export interface LogState {
    dirHandle: FileSystemDirectoryHandle | null;
    fileHandle: FileSystemFileHandle | null;
    startTime: number;
    readTime: number;
}

export const initialState: LogState = {
    dirHandle: null,
    fileHandle: null,
    startTime: 0,
    readTime: 0,
};

const refresh = async () => {
    const dirHandle = await get<FileSystemDirectoryHandle>('dirHandle');
    if (dirHandle) {
        await dirHandle.requestPermission();
    }
    return dirHandle;
};

export const createLogStore: StoreEnhancer = function (actions, state, setState) {
    let dirWatcher: DirWatcher | null = null;
    let fileWatcher: ReplayHandler | null = null;
    const log = wrapLog('log store');
    const navigate = useNavigate();

    initialize(actions, state, setState);

    actions.log = {
        reset() {
            dirWatcher?.close();
            fileWatcher?.close();
            dirWatcher = null;
            fileWatcher = null;
            actions.snitch.reset();

            batch(() => {
                setState('log', 'startTime', 0);
            });
        },
        async restore() {
            await refresh();
            actions.log.reset();
            const dirHandle = await get<FileSystemDirectoryHandle>('dirHandle');
            dirWatcher = new DirWatcher(new LiveHandler(actions));
            await dirWatcher.watchDirectory(dirHandle);
            setState('log', 'startTime', Date.now());
            navigate('/waiting');
        },

        async watch() {
            let handle: FileSystemDirectoryHandle | undefined;
            const supportsFS = 'showDirectoryPicker' in window;
            if (!supportsFS) {
                log.log("file picker isn't supported");
                return;
            }
            handle = await window.showDirectoryPicker();
            if (!handle) {
                log.warn('cancelled watching directory');
                return;
            }
            set('dirHandle', handle);
            set('fileHandle', null);
            actions.log.reset();

            dirWatcher = new DirWatcher(new LiveHandler(actions));
            dirWatcher.watchDirectory(handle);
            setState('log', 'startTime', Date.now());
            navigate('/waiting');
        },

        async replay() {
            let handle: FileSystemFileHandle | undefined;
            const supportsFS = 'showDirectoryPicker' in window;
            if (!supportsFS) {
                log.log("file picker isn't supported");
                return;
            }
            [handle] = await window.showOpenFilePicker();

            if (!handle) {
                log.warn('cancelled file selection');
                return;
            }

            set('fileHandle', handle);

            actions.log.reset();
            fileWatcher = new ReplayHandler(actions);
            fileWatcher.handleFileChange(handle);
            batch(() => {
                setState('log', 'startTime', Date.now());
            });
            navigate('/dashboard');
        },
        async stop() {
            dirWatcher?.close();
            fileWatcher?.close();
            actions.log.reset();
        },
    };
};

async function initialize(actions: Actions, state: State, setState: SetStoreFunction<State>) {
    const savedDirHandle = await get<FileSystemDirectoryHandle>('dirHandle');
    const savedFileHandle = await get<FileSystemFileHandle>('fileHandle');

    actions.ui.incLoading();
    batch(() => {
        if (savedDirHandle) {
            setState('log', 'dirHandle', savedDirHandle);
        }
        if (savedFileHandle) {
            setState('log', 'fileHandle', savedFileHandle);
        }
    });
    actions.ui.decLoading();
}
