import type { DirWatcher } from './DirWatcher';

export interface CoreInterface {
    restore: () => Promise<void>;
    watchDirectory(handle?: FileSystemDirectoryHandle): Promise<void>;
    stop(): void;
}

export interface CoreEvents {
    dirWatcherState: LogStates;
    fsDebug: Record<string, any>;
}

export enum LogStates {
    INITIAL = 'initial',
    NEED_DIR = 'need_dir',
    NEED_PERMISSION = 'need_permission',
    HAS_DIR = 'has_dir',
    HAS_FILE = 'has_file',
}

export interface FileHandler {
    handleFileChange(handle: FileSystemFileHandle): unknown;
}
