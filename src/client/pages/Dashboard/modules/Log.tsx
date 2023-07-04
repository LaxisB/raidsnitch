import { createEffect, createSignal } from 'solid-js';
import { useStore } from '../../../store';

export default function (props: any) {
    let ref: HTMLElement;
    const [state] = useStore();
    const [text, setText] = createSignal('');
    createEffect(() => {
        const addedLines = state.log.lines
            .slice(10)
            .map((line: any) => JSON.stringify(line, null, 4))
            .join('\n');
        setText(addedLines);
    });

    return <div class={props.class}>{text()}</div>;
}
