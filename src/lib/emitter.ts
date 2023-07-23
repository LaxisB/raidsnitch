export class Emitter<T extends {}> {
    private listeners: Record<keyof T, ((data: T[keyof T]) => void)[]> = {} as any;
    private onceListeners: Record<keyof T, ((data: T[keyof T]) => void)[]> = {} as any;
    private anyListeners: Function[] = [];
    private unhandledListeners: Function[] = [];

    any<K extends keyof T>(listener: (event: K, data: T[K]) => void) {
        this.anyListeners.push(listener);
    }
    unhandled<K extends keyof T>(listener: (event: K, data: T[K]) => void) {
        this.unhandledListeners.push(listener);
    }
    on<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
        this.listeners[event] = this.listeners[event] ?? [];
        this.listeners[event].push(listener as any);
    }

    once<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
        this.onceListeners[event] = this.listeners[event] ?? [];
        this.onceListeners[event].push(listener as T[K]);
    }

    off<K extends keyof T>(event: K, listener: (data: T[K]) => void) {
        this.listeners[event] = (this.listeners[event] ?? []).filter((l) => l !== listener);
    }

    emit<K extends keyof T>(event: K, data: T[K]) {
        // event listeners
        const handlers = [...(this.listeners[event] ?? []), ...(this.onceListeners[event] ?? [])];

        handlers.forEach((l) => l(data));
        this.anyListeners.forEach((l) => l(event, data));

        if (handlers.length === 0 && this.anyListeners.length === 0) {
            this.unhandledListeners.forEach((l) => l(event, data));
        }

        // clean up once listeners
        this.onceListeners[event] = [];
    }
}
