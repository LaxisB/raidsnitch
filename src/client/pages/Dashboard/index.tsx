import { formatDuration } from '@/lib/format';
import { Segment } from '@/lib/snitch/handlers/segments';
import { useNavigate } from '@solidjs/router';
import { For, Show, createMemo, createSignal } from 'solid-js';
import { useStore } from '../../store';
import classes from './dashboard.module.scss';
import Actions from './modules/Actions';
import Debug from './modules/Debug';
import Details from './modules/Details';

export default () => {
    const [store] = useStore();
    const navigate = useNavigate();

    const [segment, setSegment] = createSignal('');

    if (!store.log.fileHandle) {
        navigate('/waiting');
    }

    const latestChallengeSegment = createMemo(() => {
        if (store.snitch.segments.active.challenge) {
            return store.snitch.segments.active.challenge;
        }
        for (let i = store.snitch.segments.ids.length - 1; i >= 0; i--) {
            if (store.snitch.segments.byId[store.snitch.segments.ids[i]].type === 'challenge') {
                return store.snitch.segments.ids[i];
            }
        }
        return null;
    });

    const latestEncounterSegment = createMemo(() => {
        if (store.snitch.segments.active.encounter) {
            return store.snitch.segments.active.encounter;
        }
        for (let i = store.snitch.segments.ids.length - 1; i >= 0; i--) {
            if (store.snitch.segments.byId[store.snitch.segments.ids[i]].type === 'encounter') {
                return store.snitch.segments.ids[i];
            }
        }
        return null;
    });

    return (
        <>
            <div class={`${classes.frame} ${classes.frameDebug}`}>
                <Debug />
                <Actions class={classes.frameActions} />
            </div>
            <div class={classes.dashboard}>
                <div class={`${classes.frame} ${classes.frameStats}`}>
                    <header>segments</header>
                    <pre>{JSON.stringify(store.snitch.segments, null, 4)}</pre>
                </div>
                <div class={`${classes.frame} ${classes.frameDamage}`}>
                    <select onChange={(e) => setSegment(e.target.value)}>
                        <option selected disabled>
                            select Segment
                        </option>
                        <For each={store.snitch.segments?.ids}>
                            {(segment) => <option value={segment}>{getSegmentLabel(store.snitch.segments.byId[segment])}</option>}
                        </For>
                    </select>
                    <Show when={segment()}>
                        <Details measure="dps" segment={segment()} />
                    </Show>
                    <header>latest M+</header>
                    <Details measure="dps" segment={latestChallengeSegment()!} />
                    <Details measure="dps" segment={latestEncounterSegment()!} />
                </div>
            </div>
        </>
    );
};

function getSegmentLabel(segment: Segment) {
    if (!segment) return '';
    return `${segment.success ? 'KILL' : 'WIPE'} - ${segment.name} (${segment.duration ? formatDuration(segment.duration) : 'active'})`;
}
