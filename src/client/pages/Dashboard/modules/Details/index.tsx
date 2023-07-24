import { formatDuration, formatShortNum } from '@/lib/format';
import { For, createMemo } from 'solid-js';
import { useStore } from '../../../../store';
import classes from './dps.module.scss';

interface DetailsProps {
    measure: string;
    segment: string;
}

export default (props: DetailsProps) => {
    const [store] = useStore();

    const fallback = <span>-</span>;

    const base = createMemo(() => store.snitch[props.measure as any as 'dps']?.bySegment[props.segment]);

    const dur = createMemo(() => formatDuration(base()?.timeLast! - base()?.timeStart!));

    return (
        <div class={classes.dps}>
            <header class={classes.header}>
                {props.measure} for {store.snitch.segments.byId[props.segment]?.name} ({dur()})
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
    const counterState = () => store.snitch[props.measure as any as 'dps'].bySegment[props.segment];
    const spec = () => counterState()?.entities[props.guid]?.spec ?? 'nospec';

    const barWidth = createMemo(() => calculateBarWidth(counterState()?.entities[props.guid]?.perSecond, counterState()?.top?.perSecond));

    return (
        <div class={classes.entry} classList={{ [classes['spec' + spec()]]: true }} style={{ '--val': barWidth() }}>
            <div class={classes.entryName}>{counterState()?.entities[props.guid].name}</div>{' '}
            <div class={classes.entryValue}>
                {formatShortNum(counterState()?.entities[props.guid]?.total ?? 0)}
                {' | '}
                {formatShortNum(counterState()?.entities[props.guid]?.perSecond ?? 0).padStart(7, ' ')}
            </div>
        </div>
    );
}

function calculateBarWidth(value: number | undefined, top: number | undefined) {
    const val = ((value ?? 0) * 100) / (top ?? 1);
    return `${Math.min(val, 100).toFixed(3)}%`;
}
