import { DebugValues, SparklineDebug, SparklineOpts, TextDebug, setDebugHandler } from '@/lib/debug';
import { batch } from 'solid-js';
import { StoreEnhancer } from '../../domain';

export interface DebugActions {
    dbg(data: any): void;
    reset(): void;
}

interface SparklineConfig {
    type: 'sparkline';
    val: number[];
    opts: Partial<SparklineOpts>;
}
type TextConfig = TextDebug;

export type DebugState = Record<string, SparklineConfig | TextConfig>;

export const initialState: DebugState = {};

export const createDebugStore: StoreEnhancer = function (actions, state, setState) {
    setDebugHandler((vals) => {
        actions.debug.dbg(vals);
    });
    actions.debug = {
        dbg(debug: DebugValues) {
            batch(() => {
                for (const key in debug) {
                    if (debug[key].type === 'sparkline') {
                        let sparkline = debug[key] as any as SparklineDebug;
                        setState('debug', key, (old: unknown) => {
                            if (!old) {
                                return {
                                    type: 'sparkline',
                                    val: [sparkline.val],
                                    opts: sparkline.opts,
                                } as SparklineConfig;
                            }
                            const o = old as SparklineConfig;
                            return { ...o, val: [...o.val, sparkline.val].slice(-(o.opts?.window ?? 100)) };
                        });
                        continue;
                    }
                    if (debug[key].type === 'text') {
                        let text = debug[key] as TextConfig;
                        setState('debug', key, text);
                        continue;
                    }
                }
            });
        },
        reset() {
            setState('debug', {});
        },
    };
};
