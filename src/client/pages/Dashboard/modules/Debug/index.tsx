import Button from '@/client/components/Button';
import Grid, { GridItem } from '@/client/components/Grid';
import { For, Show, createMemo, createSignal } from 'solid-js';
import Sparkline from '../../../../components/Sparkline';
import { useStore } from '../../../../store';
import classes from './debug.module.scss';

interface DebugProps {
    class?: string;
}

export default function (props: DebugProps) {
    const [state] = useStore();

    const dbgKeys = createMemo(() => Object.keys(state.debug));
    const [show, setShow] = createSignal(false);

    return (
        <div class={props.class} classList={{ [classes.debug]: true }}>
            <Button block kind="secondary" style="ghost" onclick={() => setShow(!show())}>
                debug
            </Button>
            <Grid>
                <Show when={show()}>
                    <For each={dbgKeys()}>
                        {(key) => {
                            const data = () => state.debug[key];
                            return (
                                <>
                                    <GridItem span={4} class={classes.debugKey}>
                                        {key}
                                    </GridItem>
                                    <GridItem span={8} class={classes.debugValue}>
                                        {typeof Array.isArray(data()) && typeof data()[0] === 'number' ? (
                                            <>
                                                <Sparkline window={100} height={32} data={data} />
                                            </>
                                        ) : (
                                            data()
                                        )}
                                    </GridItem>
                                </>
                            );
                        }}
                    </For>
                </Show>
            </Grid>
        </div>
    );
}
