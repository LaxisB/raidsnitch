type HandleTypes = FileSystemDirectoryHandle | FileSystemFileHandle;

interface FileSystemFileHandle extends FileSystemHandle {
    getFile(): Promise<File>;
    createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle>;
}
interface FileSystemSyncAccessHandle {
    close(): Promise<undefined>;
    flush(): Promise<undefined>;
    getSize(): Promise<number>;
    read(buffer: Buffer, opts?: FileSystemReadWriteOptions): Promise<number>;
}
interface FileSystemDirectoryHandle extends FileSystemHandle {
    entries(): AsyncIterator<[string, HandleTypes]>;
    values(): AsyncIterator<HandleTypes>;
    keys(): AsyncIterator<string>;
}

interface FileSystemReadWriteOptions {
    /** offset to start reading from */
    at: number;
}

interface AsyncIterator<T, TReturn, TNext> {
    [Symbol.asyncIterator](): any;
}

interface FileSystemHandle {
    queryPermission(): Promise<'granted' | 'denied' | 'prompt'>;
    requestPermission(opts?: { mode: 'read' | 'readwrite' }): Promise<'granted' | 'denied'>;
}

interface Window {
    showDirectoryPicker: () => Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker: (opts?: { multiple: boolean }) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker: (opts?: { suggestedName: string }) => Promise<FileSystemFileHandle>;
}
