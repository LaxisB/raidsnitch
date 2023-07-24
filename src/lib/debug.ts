let handler: ((vals: DebugValues) => unknown) | undefined = undefined;

type DebugValues = Record<string, unknown>;

export function setDebugHandler(cb: (vals: DebugValues) => unknown) {
    handler = cb;
}

export function debug(vals: Record<string, unknown>) {
    handler?.(vals);
}
