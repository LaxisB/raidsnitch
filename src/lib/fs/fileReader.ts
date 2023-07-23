import { formatFileSize } from '../format';
import { wrapLog } from '../log';
import { sleep } from '../utils';

const log = wrapLog('fileReader');

interface FileReaderOpts {
    replayEvents: boolean;
    // amound of data to read at once
    chunkSize: number;
}

const defaultOpts: FileReaderOpts = {
    replayEvents: false,
    chunkSize: 1024 * 1024,
};

export async function* createFileReader(handle: FileSystemFileHandle, options?: Partial<FileReaderOpts>) {
    let opts = { ...defaultOpts, ...options };
    let offset = 0;
    let decoder = new TextDecoder();
    let remainder = '';
    let splitRegex = /^(?=\d)/m;
    let file = await handle.getFile();
    let failedRead = 0;

    while (true) {
        // if we reach the end of the current file handle, reload and attempt to read more
        if (offset >= file.size) {
            file = await handle.getFile();
            if (offset >= file.size) {
                failedRead++;
                const sleepTime = getBackOffTime(failedRead);
                log.warn(`no more data in file. sleeping for ${sleepTime}`);
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

function getBackOffTime(attempt: number) {
    return Math.min(100 * 2 ** attempt, 1000 * 60);
}

(window as any).fileTest = async function () {
    const { createParser } = await import('@/lib/parser');
    const [handle] = await window.showOpenFilePicker();

    const file = await handle.getFile();
    const opts = { replayEvents: false, chunkSize: 1024 * 1024 };
    const reader = createFileReader(handle, opts);
    const parser = createParser(file.lastModified);
    let failCount = 0;

    log.log('reading file');
    const start = Date.now();
    let total = 0;
    for await (const res of reader) {
        if (!res.length) {
            failCount++;
        }
        if (failCount > 1) {
            reader.return();
            break;
        }
        res.map(parser.parseLine).filter((x) => x !== null);
        total += res.length;
    }

    const end = Date.now();
    console.log(`[${formatFileSize(opts.chunkSize)}]: ${total} events finished after ${end - start}ms`);
};
