let handler: ((vals: DebugValues) => unknown) | undefined = undefined;

export type DebugValues = Record<string, DebugValue>;
export type DebugValue = SparklineDebug | TextDebug;

export function setDebugHandler(cb: (vals: DebugValues) => unknown) {
    handler = cb;
}

export function debug(vals: DebugValues) {
    handler?.(vals);
}

export interface SparklineDebug {
    type: 'sparkline';
    val: number;
    opts: Partial<SparklineOpts>;
}

export interface SparklineOpts {
    min: number;
    max: number;
    window: number;
}

export function sparkline(val: number, opts: Partial<SparklineOpts> = {}) {
    return {
        type: 'sparkline',
        val,
        opts: {
            min: 0,
            window: 100,
            ...opts,
        },
    } as SparklineDebug;
}

export interface TextDebug {
    type: 'text';
    val: string;
}
export function text(val: any) {
    return {
        type: 'text',
        val,
    } as TextDebug;
}
