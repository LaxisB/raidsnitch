import { For, createComputed, createEffect, createSignal } from 'solid-js';
import { useStore } from '../../../../store';
import classes from './dps.module.scss';
import { createStore, reconcile } from 'solid-js/store';

interface DpsProps {
    mode: 'encounter' | 'challengeMode';
}
export default (props: DpsProps) => {
    const [store] = useStore();

    const numberIntl = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

    const [dps, setDps] = createStore({
        dps: [] as { name: string; dps: number }[],
        topDps: 1,
        deltaTime: 1,
    });

    createComputed(() => {
        const counterState = store.log.stats?.dps[props.mode as 'encounter' | 'challengeMode'];
        if (!counterState) {
            setDps({ dps: [], topDps: 1, deltaTime: 1 });
            return;
        }
        const deltaTime = Math.round((counterState.timeLast - counterState.timeStart) / 1000);

        const dpsValues = Object.entries(counterState.entities).reduce((acc, entry) => {
            const [key, value] = entry;
            let entity = store.log.stats?.entities[key];
            while (entity?.ownerGuid) {
                entity = store.log.stats?.entities[entity.ownerGuid];
            }
            const name: string = entity?.name ?? 'unknown';
            const prev = acc[name] ?? { name, guid: entity?.guid, total: 0, dps: 0 };
            if (!name) return acc;
            return {
                ...acc,
                [prev.name]: {
                    ...prev,
                    damageTotal: value.damageTotal,
                    dps: value.damageTotal / deltaTime,
                },
            };
        }, {} as Record<string, { name: string; guid: string; total: number; dps: number }>);

        const dpsArray = Object.values(dpsValues)
            .filter((x) => x.guid.startsWith('Player-'))
            .sort((a, b) => b.dps - a.dps);

        setDps({ dps: dpsArray, topDps: dpsArray[0]?.dps ?? 1, deltaTime });
    });

    return (
        <div class={classes.dps}>
            <header>
                DPS for {props.mode} ({formatDuration(dps.deltaTime)})
            </header>
            <For each={dps.dps} fallback={<span>not in encounter</span>}>
                {(item) => {
                    const bgWidth = `${(item.dps * 100) / dps.topDps}%`;
                    return (
                        <div class={classes.entry} style={{ '--val': bgWidth }}>
                            <div class={classes.entryName}>{item.name}</div>{' '}
                            <div class={classes.entryValue}>{numberIntl.format(item.dps)}</div>
                        </div>
                    );
                }}
            </For>
        </div>
    );
};

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
