import { For, Match, Switch, createComputed, createEffect, createSignal } from 'solid-js';
import { useStore } from '../../store';
import classes from './dashboard.module.scss';
import Sparkline from '../../components/Sparkline';
import { createSecretKey } from 'crypto';

export default () => {
    const [state] = useStore();

    const [dbgKeys, setDbgKeys] = createSignal<{ key: string; value: any }[]>([]);

    createEffect(() => {
        setDbgKeys(Object.keys(state.fs.debug).map((key) => ({ key, value: state.fs.debug[key] })));
    });

    return (
        <div class={classes.dashboard}>
            <div classList={{ [classes.frame]: true, [classes.debug]: true }}>
                <For each={dbgKeys()}>
                    {(dbg) => (
                        <>
                            <div class={classes.debugKey}>{dbg.key}</div>
                            <div class={classes.debugValue}>
                                {typeof dbg.value[0] === 'number' ? (
                                    <>
                                        <Sparkline window={10} height={32} data={dbg.value} />
                                    </>
                                ) : (
                                    dbg.value[dbg.value.length - 1]
                                )}
                            </div>
                        </>
                    )}
                </For>
            </div>
        </div>
    );
};
