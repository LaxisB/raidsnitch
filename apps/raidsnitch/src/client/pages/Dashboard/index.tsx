import { For } from 'solid-js';
import { useStore } from '../../store';
import classes from './dashboard.module.scss';
import Actions from './modules/Actions';
import Debug from './modules/Debug';
import Details from './modules/Details';

export default () => {
  const [state] = useStore();
  return (
    <div class={classes.dashboard}>
      <div class={`${classes.frame} ${classes.frameStats}`}>
        <header>segments</header>
        <pre>{JSON.stringify(state.log.stats?.segments, null, 4)}</pre>
      </div>
      <div class={`${classes.frame} ${classes.frameDebug}`}>
        <Debug />
        <hr />
        <br />
        <Actions class={`${classes.frameActions}`} />
      </div>
      <div class={`${classes.frame} ${classes.frameDamage}`}>
        <For each={state.log.stats?.segments?.ids}>{(segment) => <Details measure="dps" segment={segment} />}</For>
      </div>
      <div class={`${classes.frame} ${classes.frameHealing}`}>
        <For each={state.log.stats?.segments?.ids}>{(segment) => <Details measure="hps" segment={segment} />}</For>
      </div>
    </div>
  );
};
