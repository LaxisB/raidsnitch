import { For, createEffect, createSignal } from 'solid-js';
import Sparkline from '../../../../components/Sparkline';
import { useStore } from '../../../../store';
import classes from './debug.module.scss';

interface DebugProps {
  class?: string;
}

export default function (props: DebugProps) {
  const [state] = useStore();

  const [dbgKeys, setDbgKeys] = createSignal<{ key: string; value: any }[]>([]);

  createEffect(() => {
    setDbgKeys(Object.keys(state.debug).map((key) => ({ key, value: state.debug[key] })));
  });

  return (
    <div class={props.class} classList={{ [classes.debug]: true }}>
      <For each={dbgKeys()}>
        {(dbg) => (
          <>
            <div class={classes.debugKey}>{dbg.key}</div>
            <div class={classes.debugValue}>
              {typeof dbg.value[0] === 'number' ? (
                <>
                  <Sparkline window={100} height={32} data={dbg.value} />
                </>
              ) : (
                dbg.value[dbg.value.length - 1]
              )}
            </div>
          </>
        )}
      </For>
    </div>
  );
}
