import { createEffect, createMemo, createSignal } from 'solid-js';
import { ilerp } from '../../../lib/lerp';
import classes from './sparkline.module.scss';
interface SparklineProps {
  height: number;
  window: number;
  data: () => number[];
}

export default (props: SparklineProps) => {
  let el: SVGElement;
  let [viewBox, setViewBox] = createSignal('0 0 0 0 ');
  let [path, setPath] = createSignal('');

  let intl = new Intl.NumberFormat('en-US');
  let currentVal = createMemo(() => {
    const data = props.data();
    return data[data.length - 1];
  });
  createEffect(() => {
    let data = props.data();
    const width = Math.max(el.clientWidth, props.window);
    const items = data.slice(-props.window);
    const height = props.height;

    const min = Math.min(...items) ?? 0;
    const max = Math.max(...items) ?? 0;

    const perItemOffset = width / items.length;

    setViewBox(`0 0 ${width} ${height}`);
    const path = items
      .map((v, i) => {
        let y = height - (height * ilerp(min, max, v) ?? height / 2);
        if (isNaN(y)) {
          y = height / 2;
        }
        return `${i * perItemOffset} ${y}`;
      })
      .join(' L');
    setPath(path);
  });

  return (
    <svg height={props.height} ref={(e) => (el = e)} class={classes.sparkline} viewBox={viewBox()}>
      <path d={`M${path()}`} fill="none" />
      <text y={props.height / 2} dominant-baseline="middle">
        {currentVal() < 1 ? currentVal().toPrecision(2) : intl.format(currentVal())}
      </text>
    </svg>
  );
};
