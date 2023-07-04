import { createEffect, createSignal } from 'solid-js';
import { useStore } from '../../../../store';
import classes from './log.module.scss';

export default function (props: any) {
    const [state] = useStore();
    const [text, setText] = createSignal('');
    createEffect(() => {
        const addedLines = state.log.lines
            .slice(-5)
            .reverse()
            .map((line: any) => JSON.stringify(line, null, 4))
            .join('\n');
        setText(addedLines);
    });

    return <div class={`${props.class ?? ''} ${classes.log}`}>{text()}</div>;
}
