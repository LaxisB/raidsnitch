import { For, createMemo } from 'solid-js';
import { useStore } from '../../../../store';
import classes from './dps.module.scss';

interface DetailsProps {
  measure: string;
  segment: string;
}
const numberIntl = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

export default (props: DetailsProps) => {
  const [store] = useStore();

  const fallback = <span>-</span>;

  const base = createMemo(() => store.log.stats?.[props.measure as any as 'dps']?.bySegment[props.segment]);

  const dur = createMemo(() => formatDuration(base()?.timeLast! - base()?.timeStart!));

  return (
    <div class={classes.dps}>
      <header>
        {props.measure} for {store.log.stats?.segments.byId[props.segment]?.name} ({dur()})
      </header>
      <For each={base()?.ids} fallback={fallback}>
        {(guid) => <DetailsLine guid={guid} measure={props.measure} segment={props.segment} />}
      </For>
    </div>
  );
};

interface DetailsLineProps {
  guid: string;
  measure: string;
  segment: string;
}
function DetailsLine(props: DetailsLineProps) {
  const [store] = useStore();
  const counterState = () => store.log.stats?.[props.measure as any as 'dps'].bySegment[props.segment];

  const barWidth = createMemo(() => calculateBarWidth(counterState()?.entities[props.guid]?.perSecond, counterState()?.top?.perSecond));

  return (
    <div class={classes.entry} style={{ '--val': barWidth() }}>
      <div class={classes.entryName}>{store.log.stats?.entities?.[props.guid].name}</div>{' '}
      <div class={classes.entryValue}>
        {formatNum(counterState()?.entities[props.guid]?.total ?? 0)}
        {' | '}
        {formatNum(counterState()?.entities[props.guid]?.perSecond ?? 0).padStart(7, ' ')}
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

function calculateBarWidth(value: number | undefined, top: number | undefined) {
  const val = ((value ?? 0) * 100) / (top ?? 1);
  return `${Math.min(val, 100).toFixed(3)}%`;
}

function formatNum(value?: number) {
  if (!value) {
    return '0';
  }
  if (value < 1000) {
    return numberIntl.format(value);
  }
  if (value < 1000000) {
    return numberIntl.format(value / 1000) + 'k';
  }
  return numberIntl.format(value / 1000000) + 'm';
}
