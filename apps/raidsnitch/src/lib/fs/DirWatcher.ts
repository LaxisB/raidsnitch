import { wrapLog } from '@raidsnitch/shared/log';
import { get, set } from 'idb-keyval';
import { FileHandler, LogStates } from './domain';

const log = wrapLog('dir_watcher');

export class DirWatcher {
    private dirHandle: FileSystemDirectoryHandle | null = null;
    private fileHandle: FileSystemFileHandle | null = null;
    private readDirTimeout: NodeJS.Timeout | null = null;
    protected state = LogStates.INITIAL;

    constructor( private fileHandler: FileHandler) {}

    async restore() {
        const dirHandle = await get('dirHandle');
        if (dirHandle) {
            log.debug('restoring dir handle from idb');
            this.dirHandle = dirHandle;
            this.setState(LogStates.NEED_PERMISSION);
        } else {
            this.setState(LogStates.NEED_DIR);
        }
    }

    async watchDirectory(handle?: FileSystemDirectoryHandle) {
        if (handle) {
            this.dirHandle = handle;
            this.setState(LogStates.NEED_PERMISSION);
            set('dirHandle', handle);
        }
        if (!this.dirHandle) {
            throw new Error('no directory handle');
        }
        const perms = await this.dirHandle.queryPermission();
        if (perms !== 'granted') {
            throw new Error("don't have permission to read directory");
        }

        this.setState(LogStates.HAS_DIR);

        this.watchForFileChanges();
    }

    close() {
        if (this.fileHandler) {
            this.fileHandler.close();
        }
        if (this.readDirTimeout) {
            clearTimeout(this.readDirTimeout);
            this.readDirTimeout = null;
        }
    }

    // poll the directory for the latest interesting file and update the state
    async watchForFileChanges() {
        if (!this.dirHandle) {
            return;
        }

        const file = await this.getLatestCombatLog();

        if (file && file.name != this.fileHandle?.name) {
            this.fileHandle = file;
            this.setState(LogStates.HAS_FILE);
            this.fileHandler.handleFileChange(file);
        }

        // if we're actively reading from a file, we probably don't need to look for a new one
        this.readDirTimeout = setTimeout(
            () => this.watchForFileChanges(),
            this.state === LogStates.HAS_FILE ? 10_000 : 1000,
        );
    }

    private async getLatestCombatLog() {
        if (!this.dirHandle) {
            throw new Error('no dirHandle');
        }

        let latest: FileSystemFileHandle | null = null;
        let latestMod = 0;
        for await (let entry of this.dirHandle.values()) {
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
    private setState(state: LogStates) {
        this.state = state;
    }
}

export function fileIsCombatLog(name: string) {
    return name.startsWith('WoWCombatLog-');
}
function handleIsDirectory(handle: any): handle is FileSystemDirectoryHandle {
    return handle instanceof FileSystemHandle && handle.kind === 'directory';
}
