export function bytesToKb(bytes: number) {
    return bytes / 1024;
}
export function bytesToMb(bytes: number) {
    return bytesToKb(bytes) / 1024;
}

export function formatFileSize(bytes: number) {
    if (bytes < 1024) {
        return `${bytes}B`;
    }
    if (bytes < 1024 * 1024) {
        return `${bytesToKb(bytes).toFixed(2)}KiB`;
    }
    return `${bytesToMb(bytes).toFixed(2)}MiB`;
}
