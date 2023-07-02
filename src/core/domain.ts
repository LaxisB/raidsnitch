import type { FsHandler } from './fsHandler';

export interface CoreInterface {
    restore: () => Promise<void>;
    watchDirectory(handle?: FileSystemDirectoryHandle): Promise<void>;
    stop(): void;
}

export interface CoreEvents {
    state: FsHandler['state'];
}

export enum LogStates {
    INITIAL = 'initial',
    NEED_DIR = 'need_dir',
    NEED_PERMISSION = 'need_permission',
    HAS_DIR = 'has_dir',
    HAS_FILE = 'has_file',
    READING_FILE = 'reading_file',
    IDLE = 'idle',
}
