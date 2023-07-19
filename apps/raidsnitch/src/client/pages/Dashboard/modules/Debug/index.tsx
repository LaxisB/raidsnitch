import { For, createMemo } from 'solid-js';
import Sparkline from '../../../../components/Sparkline';
import { useStore } from '../../../../store';
import classes from './debug.module.scss';

interface DebugProps {
  class?: string;
}

export default function (props: DebugProps) {
  const [state] = useStore();

  const dbgKeys = createMemo(() => Object.keys(state.debug));

  return (
    <div class={props.class} classList={{ [classes.debug]: true }}>
      <For each={dbgKeys()}>
        {(key) => {
          const data = () => state.debug[key];
          return (
            <>
              <div class={classes.debugKey}>{key}</div>
              <div class={classes.debugValue}>
                {typeof Array.isArray(data()) && typeof data()[0] === 'number' ? (
                  <>
                    <Sparkline window={100} height={32} data={data} />
                  </>
                ) : (
                  data()
                )}
              </div>
            </>
          );
        }}
      </For>
    </div>
  );
}
