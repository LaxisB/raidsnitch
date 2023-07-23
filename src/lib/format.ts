const numberIntl = new Intl.NumberFormat(navigator.language, { maximumFractionDigits: 2 });

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
export function formatShortNum(value?: number) {
    if (!value) {
        return '0';
    }
    if (value < 1000) {
        return numberIntl.format(value);
    }
    if (value < 1000000) {
        return numberIntl.format(value / 1000) + 'k';
    }
    return numberIntl.format(value / 1000000) + 'm';
}
export function formatDuration(millis?: number) {
    if (!millis) {
        return '0:00';
    }
    const seconds = Math.floor(millis / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
