import { State } from '../lib/snitch';

export interface CoreInterface {
    restore: () => Promise<void>;
    watchDirectory(handle?: FileSystemDirectoryHandle): Promise<void>;
    readFile(handle: FileSystemFileHandle): Promise<void>;
    stop(): void;
}

export interface CoreEvents {
    dirWatcherState: LogStates;
    logDebug: Record<string, any>;
    logEvents: any[];
    stats: State;
    logDone: boolean;
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
    close(): Promise<void>;
}
