import { get, set } from 'idb-keyval';
import { LogStates } from './domain';
import { wrapLog } from '../lib/log';
import { emitter } from './emitter';

const log = wrapLog('fs handler');

export class FsHandler {
    #dirHandle: FileSystemDirectoryHandle | null = null;
    #fileHandle: FileSystemFileHandle | null = null;
    #state = LogStates.INITIAL;

    #readDirTimeout: NodeJS.Timeout | null = null;

    async restore() {
        const dirHandle = await get('dirHandle');
        if (dirHandle) {
            this.#dirHandle = dirHandle;
            this.#setState(LogStates.NEED_PERMISSION);
        } else {
            this.#setState(LogStates.NEED_DIR);
        }
    }

    async watchDirectory(handle?: FileSystemDirectoryHandle) {
        if (handle) {
            this.#dirHandle = handle;
            this.#setState(LogStates.NEED_PERMISSION);
            set('dirHandle', handle);
        }
        if (!this.#dirHandle) {
            throw new Error('no directory handle');
        }
        const perms = await this.#dirHandle.queryPermission();
        if (perms !== 'granted') {
            throw new Error("don't have permission to read directory");
        }

        this.#watchForFileChanges();
    }

    stop() {
        if (this.#readDirTimeout) {
            clearTimeout(this.#readDirTimeout);
            this.#readDirTimeout = null;
        }
    }

    get state() {
        return this.#state;
    }

    #setState(state: LogStates) {
        this.#state = state;
        emitter.emit('state', state);
    }

    // poll the directory for the latest interesting file and update the state
    async #watchForFileChanges() {
        if (!this.#dirHandle) {
            return;
        }

        const file = await this.#getLatestCombatLog();
        if (file && file.name != this.#fileHandle?.name) {
            const f = await file.getFile();
            log.debug(
                `latest log: ${f.name} (${(f.size / 1024).toFixed(2)}KiB) from ${new Date(
                    f.lastModified,
                ).toLocaleString()}`,
            );
            this.#fileHandle = file;
            this.#setState(LogStates.HAS_FILE);
        }

        // if we're actively reading from a file, we probably don't need to look for a new one
        this.#readDirTimeout = setTimeout(
            () => this.#watchForFileChanges(),
            this.#state === LogStates.READING_FILE ? 10_000 : 1000,
        );
    }

    async #getLatestCombatLog() {
        if (!this.#dirHandle) {
            return Promise.reject('no dirHandle');
        }

        let latest: FileSystemFileHandle | null = null;
        let latestMod = 0;
        for await (let entry of this.#dirHandle.values()) {
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
}

export function fileIsCombatLog(name: string) {
    return name.startsWith('WoWCombatLog-');
}
function handleIsDirectory(handle: any): handle is FileSystemDirectoryHandle {
    return handle instanceof FileSystemHandle && handle.kind === 'directory';
}
function handleIsFile(handle: any): handle is FileSystemFileHandle {
    return handle instanceof FileSystemHandle && handle.kind === 'file';
}

// =========================
// Types
