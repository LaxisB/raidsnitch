let disabledPrefixes: string[] = [];
export function wrapLog(component: string) {
    const prefix = `[${component}]`;

    // assuming that the given prefix is "component:subcomponent"
    // the log is disabled if either "component" or "component:subcomponent" is disabled
    const isDisabled = () => {
        return disabledPrefixes.some((p) => prefix.startsWith(p));
    };
    return {
        trace(...args: any[]) {
            isDisabled() ? null : console.trace(prefix, ...args);
        },
        debug(...args: any[]) {
            isDisabled() ? null : console.debug(prefix, ...args);
        },
        log(...args: any[]) {
            isDisabled() ? null : console.log(prefix, ...args);
        },
        warn(...args: any[]) {
            isDisabled() ? null : console.warn(prefix, ...args);
        },
        error(...args: any[]) {
            isDisabled() ? null : console.error(prefix, ...args);
        },
        table(args: any[], props?: string[]) {
            isDisabled() ? null : console.table(args, props);
        },
    };
}

export function disable(prefix: string) {
    disabledPrefixes.push(prefix);
}
export function enable(prefix: string) {
    disabledPrefixes = disabledPrefixes.filter((x) => x === prefix);
}
