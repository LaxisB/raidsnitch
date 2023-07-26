import { formatDuration, formatShortNum } from '@/lib/format';
import { DpsGroup, DpsMeasure } from '@/lib/snitch/handlers/dps';
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
    const dur = createMemo(() => formatDuration(base()?.duration));
    const ids = () => base()?.ids?.map((id) => base().entities[id]) ?? [];

    return (
        <div class={classes.dps}>
            <header class={classes.header}>
                {props.measure} for {store.snitch.segments.byId[props.segment]?.name} ({dur()})
            </header>
            <For each={ids()} fallback={fallback}>
                {(entity) => <DetailsLine entity={entity} segment={base()} />}
            </For>
        </div>
    );
};

interface DetailsLineProps {
    entity: DpsMeasure;
    segment: DpsGroup;
}
function DetailsLine(props: DetailsLineProps) {
    const spec = () => props.entity?.spec ?? 'nospec';

    const barWidth = createMemo(() => calculateBarWidth(props.entity?.total, props.segment?.top?.total));

    return (
        <div class={classes.entry} classList={{ [classes['spec' + spec()]]: true }} style={{ '--val': barWidth() }}>
            <div class={classes.entryName}>{formatName(props.entity.name)}</div>{' '}
            <div class={classes.entryValue}>
                {formatShortNum(props.entity?.total ?? 0)}
                {' | '}
                {formatShortNum(props.entity?.perSecond ?? 0).padStart(7, ' ')}
            </div>
        </div>
    );
}

function calculateBarWidth(value: number | undefined, top: number | undefined) {
    const val = ((value ?? 0) * 100) / (top ?? 1);
    return `${Math.min(val, 100).toFixed(3)}%`;
}
function formatName(name?: string) {
    return (name ?? '').split('-')[0];
}
