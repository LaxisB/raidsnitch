import { createSignal, onMount } from 'solid-js';
import classes from './sparkline.module.scss';
import { ilerp } from '../../../core/lerp';
interface SparklineProps {
    height: number;
    window: number;
    data: number[];
}

export default (props: SparklineProps) => {
    let el: SVGElement;
    let [viewBox, setViewBox] = createSignal('0 0 0 0 ');
    let [path, setPath] = createSignal('');

    onMount(() => {
        const width = Math.max(el.clientWidth, props.window);
        const height = props.height;

        const min = Math.min(...props.data) ?? 0;
        const max = Math.max(...props.data) ?? 0;

        const perItemOffset = width / props.data.length;

        setViewBox(`0 0 ${width} ${height}`);
        const path = props.data
            .slice(-props.window)
            .map((v, i) => {
                let y = height - (height * ilerp(min, max, v) ?? height / 2);
                if (isNaN(y)) {
                    y = height / 2;
                    debugger;
                }
                return `${i * perItemOffset} ${y}`;
            })
            .join(' L');
        setPath(path);
    });

    return (
        <svg height={props.height} ref={(e) => (el = e)} class={classes.sparkline} viewBox={viewBox()}>
            <path d={`M${path()}`} fill="none" stroke="white" />
            <text y={props.height / 2} fill="white" dominant-baseline="middle">
                {props.data[props.data.length - 1]}
            </text>
        </svg>
    );
};
