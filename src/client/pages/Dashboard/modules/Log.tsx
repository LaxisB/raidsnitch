import { createEffect, onMount } from 'solid-js';
import { useStore } from '../../../store';

export default function (props: any) {
    let ref: HTMLElement;
    const [state] = useStore();
    createEffect(() => {
        const addedLines = state.log.lines.map((line: any) => line.event).join('\n');
        ref.textContent = addedLines;
    });

    return <pre class={props.class} ref={(el) => (ref = el)}></pre>;
}
