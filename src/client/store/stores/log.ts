import { debug } from '@/lib/debug';
import * as fs from '@/lib/fs';
import { wrapLog } from '@/lib/log';
import { WowEvent, createParser } from '@/lib/parser';
import { useNavigate } from '@solidjs/router';
import { get, set } from 'idb-keyval';
import { batch } from 'solid-js';
import { SetStoreFunction } from 'solid-js/store';
import type { Actions, State, StoreEnhancer } from '../../domain';

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
    let dirWatcher: fs.DirWatcher | null = null;
    let fileReader: fs.FileReader | null = null;
    const readerOpts = { replayEvents: false, chunkSize: 128 * 1024, splitRegex: /^(?=\d)/m };
    const log = wrapLog('log store');
    const navigate = useNavigate();

    initialize(actions, state, setState).catch(console.error);

    const readFile = async (handle: FileSystemFileHandle, tail = true) => {
        fileReader?.stop();
        fileReader = fs.createFileReader(handle, { ...readerOpts, tail });
        set('fileHandle', handle);
        setState('log', 'fileHandle', handle);
        const file = await handle.getFile();
        const parser = createParser(file.lastModified);
        let fileStart = Date.now();
        let parseStart = fileStart;
        for await (const chunk of fileReader.items()) {
            if (!chunk || !chunk.length) {
                continue;
            }
            const parsed = chunk
                .map((x) => {
                    return parser.parseLine(x);
                })
                .filter((x) => !!x) as WowEvent[];
            const parseDur = Date.now() - parseStart;
            debug({ chunkSize: chunk.length, 'parse Time (ms)': parseDur, 'parses/ms': chunk.length / parseDur });
            actions.snitch.handleEvents(parsed);
            parseStart = Date.now();
        }
    };

    actions.log = {
        reset() {
            dirWatcher?.stop();
            fileReader?.stop();
            dirWatcher = null;
            fileReader = null;
            actions.snitch.reset();

            batch(() => {
                setState('log', 'startTime', 0);
            });
        },
        async restore() {
            await refresh();
            actions.log.reset();
            const dirHandle = await get<FileSystemDirectoryHandle>('dirHandle');
            if (!dirHandle) {
                return;
            }
            setState('log', 'dirHandle', dirHandle);
            dirWatcher = fs.createDirWatcher(dirHandle);
            dirWatcher.onFileChange(readFile);
            dirWatcher.start();
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
            setState('log', 'dirHandle', handle);
            set('dirHandle', handle);
            set('fileHandle', null);
            actions.log.reset();

            dirWatcher = fs.createDirWatcher(handle, { emitOnStart: true });
            dirWatcher.onFileChange(readFile);
            dirWatcher.start();
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
            readFile(handle);
            batch(() => {
                setState('log', 'startTime', Date.now());
            });
            navigate('/dashboard');
        },
        async stop() {
            dirWatcher?.stop();
            fileReader?.stop();
            actions.log.reset();
        },
    };
};

async function initialize(actions: Actions, state: State, setState: SetStoreFunction<State>) {
    await set('loadTime', Date.now());
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
