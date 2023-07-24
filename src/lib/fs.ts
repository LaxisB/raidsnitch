import { formatFileSize } from '@/lib/format';
import { wrapLog } from '@/lib/log';
import { sleep } from '@/lib/utils';
import { debug } from './debug';

const log = wrapLog('fileReader');

interface FileReaderOpts {
    /** amount of bytes to read at once
     * @default 64KiB
     */
    chunkSize: number;
    /** keep the file open when reaching the end and watch for changes
     * @default false
     */
    tail: boolean;
    /**change the regex used to split the file into items
     * @default /\n/
     */
    splitRegex: RegExp;
}

/**
 * create a file reader that reads a file in chunks
 * @param handle file handle to read
 * @param options options for the reader
 * @returns a handle to the reader
 * @example
 * const file = await window.showOpenFilePicker();
 * const reader = createFileReader(file, { tail: true }});
 * for await (const res of reader.getReader()) {
 *   if (!res.length) {
 *     // no changes, wait for more
 *     // this waits using an exponential backoff
 *     // we need to do this to avoid running into timeouts regarding await
 *     break;
 *   }
 *   console.log(res);
 * }
 * reader.stop();
 *
 */
export function createFileReader(handle: FileSystemFileHandle, options?: Partial<FileReaderOpts>) {
    let opts: FileReaderOpts = { tail: false, chunkSize: 64 * 1024, splitRegex: /\n/, ...options };
    let doStop = false;
    let reader: AsyncGenerator<string[]> | null = null;

    async function* getReader() {
        let file = await handle.getFile();
        let offset = 0;
        let decoder = new TextDecoder();
        let remainder = '';
        let failedRead = 0;

        while (true) {
            if (doStop) {
                return [];
            }
            // if we reach the end of the current file handle, reload and attempt to read more
            if (offset >= file.size) {
                if (!opts.tail) {
                    return [];
                }
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
            const lines = (remainder + chunk).split(opts.splitRegex);
            remainder = lines.pop() ?? '';

            debug({
                file: file.name,
                size: file.size,
                offset,
                chunkSize: opts.chunkSize,
                lines: lines.length,
            });
            yield lines;
        }
    }

    return {
        items() {
            reader = reader ?? getReader();
            return reader;
        },
        stop() {
            doStop = true;
        },
    };
}

export type FileReader = ReturnType<typeof createFileReader>;

interface DirWatcherOpts {
    /**
     * emit the newest file on start
     * @default true
     */
    emitOnStart: boolean;
}

/** watch a directory for changes, specifically for new combat logs
 * @param handle directory handle to watch
 * @param options options for the watcher
 * @returns a handle to the watcher
 * @example
 * const dir = await window.showDirectoryPicker();
 * const watcher = createDirWatcher(dir);
 * watcher.onFileChange(async (handle) => {
 *    const file = await handle.getFile();
 *   console.log('newest log changed', file.name);
 * });
 * watcher.start();
 */
export function createDirWatcher(handle: FileSystemDirectoryHandle, options?: Partial<DirWatcherOpts>) {
    let opts: DirWatcherOpts = { emitOnStart: true, ...options };
    let lastActiveFile: FileSystemFileHandle | null = null;
    let onFileChange: ((file: FileSystemFileHandle) => void) | null = null;
    let runningTimeout: NodeJS.Timeout | null = null;

    async function watchForFileChanges() {
        const file = await getLatestCombatLog();
        if (file) {
            if (file.name !== lastActiveFile?.name) {
                lastActiveFile = file;
                debug({
                    dir: handle.name,
                    fileChange: new Date().toLocaleTimeString(),
                });
                onFileChange?.(file);
            }
        }
        runningTimeout = setTimeout(watchForFileChanges, 1000);
    }
    async function getLatestCombatLog() {
        let latest: FileSystemFileHandle | null = null;
        let latestMod = 0;
        for await (let entry of handle.values()) {
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
            lastActiveFile = await getLatestCombatLog();
            if (opts.emitOnStart && lastActiveFile) {
                onFileChange?.(lastActiveFile);
            }
            watchForFileChanges();
        },
        stop() {
            clearTimeout(runningTimeout!);
        },
    };
}

export type DirWatcher = ReturnType<typeof createDirWatcher>;

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
    const readerOpts = { replayEvents: false, chunkSize: 1024 * 1024, splitRegex: /^(?=\d)/m };
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
        for await (const res of reader.items()) {
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
