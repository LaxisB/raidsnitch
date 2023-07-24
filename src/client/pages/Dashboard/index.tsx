import { Segment } from '@/lib/snitch/handlers/segments';
import { useNavigate } from '@solidjs/router';
import { For, Show, createSignal } from 'solid-js';
import { useStore } from '../../store';
import classes from './dashboard.module.scss';
import Actions from './modules/Actions';
import Debug from './modules/Debug';
import Details from './modules/Details';

export default () => {
    const [state] = useStore();
    const navigate = useNavigate();

    const [segment, setSegment] = createSignal('');

    if (!state.log.fileHandle) {
        navigate('/waiting');
    }

    return (
        <div class={classes.dashboard}>
            <div class={`${classes.frame} ${classes.frameStats}`}>
                <header>segments</header>
                <pre>{JSON.stringify(state.snitch.segments, null, 4)}</pre>
            </div>
            <div class={`${classes.frame} ${classes.frameDebug}`}>
                <Debug />
                <hr />
                <br />
                <Actions class={`${classes.frameActions}`} />
            </div>
            <div class={`${classes.frame} ${classes.frameDamage}`}>
                <select onChange={(e) => setSegment(e.target.value)}>
                    <option selected disabled>
                        select Segment
                    </option>
                    <For each={state.snitch.segments?.ids}>
                        {(segment) => <option value={segment}>{getSegmentLabel(state.snitch.segments.byId[segment])}</option>}
                    </For>
                </select>
                <Show when={segment()}>
                    <Details measure="dps" segment={segment()} />
                </Show>
                <hr />
                <Show when={state.snitch.segments.active.challenge}>
                    <header>Active M+</header>
                    <Details measure="dps" segment={state.snitch.segments.active.challenge!} />
                </Show>
                <Show when={state.snitch.segments.active.encounter}>
                    <header>Active Encounter</header>
                    <Details measure="dps" segment={state.snitch.segments.active.encounter!} />
                </Show>
            </div>
        </div>
    );
};

function getSegmentLabel(segment: Segment) {
    if (!segment) return '';
    return `${segment.name} (${segment.endTime ? segment.endTime - segment.startTime : 'active'})`;
}
