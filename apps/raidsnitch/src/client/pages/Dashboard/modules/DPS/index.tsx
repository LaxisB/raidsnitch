import { For, createMemo } from 'solid-js';
import { useStore } from '../../../../store';
import classes from './dps.module.scss';

interface DpsProps {
  mode: 'encounter' | 'challengeMode';
}
const numberIntl = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export default (props: DpsProps) => {
  const [store] = useStore();

  const fallback = <span>-</span>;

  const dur = createMemo(() =>
    formatDuration(store.log.stats?.dps?.[props.mode]?.timeLast! - store.log.stats?.dps?.[props.mode]?.timeStart!),
  );

  return (
    <div class={classes.dps}>
      <header>
        DPS for {props.mode} ({dur()})
      </header>
      <For each={store.log.stats?.dps?.[props.mode]?.ids} fallback={fallback}>
        {(guid) => <DpsLine guid={guid} mode={props.mode} />}
      </For>
    </div>
  );
};

interface DpsLineProps {
  guid: string;
  mode: 'encounter' | 'challengeMode';
}
function DpsLine(props: DpsLineProps) {
  const [store] = useStore();
  const counterState = () => store.log.stats?.dps[props.mode as 'encounter' | 'challengeMode'];

  const barWidth = createMemo(() => calculateBarWidth(counterState()?.entities[props.guid].dps, counterState()?.topPerformer?.dps));

  return (
    <div class={classes.entry} style={{ '--val': barWidth() }}>
      <div class={classes.entryName}>{store.log.stats?.entities?.[props.guid].name}</div>{' '}
      <div class={classes.entryValue}>
        {formatDamage(counterState()?.entities[props.guid].damageTotal ?? 0)}
        {' | '}
        {formatDamage(counterState()?.entities[props.guid].dps ?? 0).padStart(7, ' ')}
      </div>
    </div>
  );
}

function formatDuration(millis?: number) {
  if (!millis) {
    return '0:00';
  }
  const seconds = Math.floor(millis / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function calculateBarWidth(dps: number | undefined, topDps: number | undefined) {
  const val = ((dps ?? 0) * 100) / (topDps ?? 1);
  return `${Math.min(val, 100).toFixed(3)}%`;
}

function formatDamage(dps?: number) {
  if (!dps) {
    return '0';
  }
  if (dps < 1000) {
    return numberIntl.format(dps);
  }
  if (dps < 1000000) {
    return numberIntl.format(dps / 1000) + 'k';
  }
  return numberIntl.format(dps / 1000000) + 'm';
}
