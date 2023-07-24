import { formatFileSize } from '../format';
import { wrapLog } from '../log';
import { sleep } from '../utils';

const log = wrapLog('fileReader');

interface FileReaderOpts {
    replayEvents: boolean;
    // amound of data to read at once
    chunkSize: number;
}
export function createFileReader(handle: FileSystemFileHandle, options?: Partial<FileReaderOpts>) {
    let opts: FileReaderOpts = { replayEvents: false, chunkSize: 1024 * 1024, ...options };
    let doStop = false;
    let reader: AsyncGenerator<string[]> | null = null;

    async function* getReader() {
        let file = await handle.getFile();
        let offset = 0;
        let decoder = new TextDecoder();
        let remainder = '';
        let splitRegex = /^(?=\d)/m;
        let failedRead = 0;

        while (true) {
            if (doStop) {
                return [];
            }
            // if we reach the end of the current file handle, reload and attempt to read more
            if (offset >= file.size) {
                file = await handle.getFile();
                if (offset >= file.size) {
                    const sleepTime = getBackOffTime(Math.min(5, failedRead++));
                    yield [];
                    await sleep(sleepTime);
                    continue;
                }
            }

            const value = file.slice(offset, offset + opts.chunkSize);
            const buffer = await value.arrayBuffer();
            offset += value.size;
            const chunk = decoder.decode(buffer, { stream: true });
            const lines = (remainder + chunk).split(splitRegex);
            remainder = lines.pop() ?? '';
            yield lines;
        }
    }

    return {
        getReader() {
            reader = reader ?? getReader();
            return reader;
        },
        stop() {
            doStop = true;
        },
    };
}

interface DirWatcherOpts {
    emitOnStart: boolean;
}
export function createDirWatcher(handle: FileSystemDirectoryHandle, options?: Partial<DirWatcherOpts>) {
    let opts: DirWatcherOpts = { emitOnStart: false, ...options };
    let lastActiveFile: FileSystemFileHandle | null = null;
    let onFileChange: ((file: FileSystemFileHandle) => void) | null = null;
    let runningTimeout: NodeJS.Timeout | null = null;

    async function watchForFileChanges() {
        if (!handle) {
            return;
        }

        const file = await getLatestCombatLog();
        if (file) {
            if (file.name !== lastActiveFile?.name) {
                lastActiveFile = file;
                onFileChange?.(file);
            }
        }
        runningTimeout = setTimeout(watchForFileChanges, 1000);
    }
    async function getLatestCombatLog() {
        if (!handle) {
            throw new Error('no dirHandle');
        }

        let latest: FileSystemFileHandle | null = null;
        let latestMod = 0;
        for await (let entry of handle.values()) {
            if (handleIsDirectory(entry)) {
                continue;
            }
            if (!fileIsCombatLog(entry.name)) {
                continue;
            }
            const mod = (await entry.getFile()).lastModified;
            if (mod > latestMod) {
                latest = entry;
                latestMod = mod;
            }
        }
        return latest;
    }

    return {
        onFileChange(cb: (file: FileSystemFileHandle) => void) {
            onFileChange = cb;
        },
        async start() {
            if (opts.emitOnStart) {
                lastActiveFile = await getLatestCombatLog();
                if (lastActiveFile) {
                    onFileChange?.(lastActiveFile);
                }
            }
            watchForFileChanges();
        },
        stop() {
            clearTimeout(runningTimeout!);
        },
    };
}

function fileIsCombatLog(name: string) {
    return name.startsWith('WoWCombatLog-');
}
function handleIsDirectory(handle: any): handle is FileSystemDirectoryHandle {
    return handle instanceof FileSystemHandle && handle.kind === 'directory';
}

/** exponential backoff fn */
function getBackOffTime(attempt: number) {
    return Math.min(100 * 2 ** attempt, 1000 * 60);
}

(window as any).fileTest = async function () {
    const { createParser } = await import('@/lib/parser');
    const dir = await window.showDirectoryPicker();
    const readerOpts = { replayEvents: false, chunkSize: 1024 * 1024 };
    let parser = createParser(0);
    let activeReader: ReturnType<typeof createFileReader> | null = null;

    function replaceReader(newReader: ReturnType<typeof createFileReader>) {
        activeReader?.stop();
        activeReader = newReader;

        drainReader(newReader);
    }

    async function drainReader(reader: ReturnType<typeof createFileReader>) {
        log.log('reading file');
        const start = Date.now();
        let total = 0;
        for await (const res of reader.getReader()) {
            if (!res.length) {
                reader.stop();
                break;
            }
            res.map(parser.parseLine).filter((x) => x !== null);
            total += res.length;
        }
        const end = Date.now();
        console.log(`[${formatFileSize(readerOpts.chunkSize)}]: ${total} events finished after ${end - start}ms`);
    }

    const dirHandler = createDirWatcher(dir, { emitOnStart: true });
    dirHandler.onFileChange(async (handle) => {
        const file = await handle.getFile();
        log.log('newest log changed', file.name);
        const reader = createFileReader(handle, readerOpts);
        parser = createParser(file.lastModified);
        replaceReader(reader);
    });
    dirHandler.start();
};
