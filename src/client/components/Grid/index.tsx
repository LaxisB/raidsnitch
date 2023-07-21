import { ParentProps } from 'solid-js';
import classes from './grid.module.scss';

interface GridProps {
  class?: string;
  center?: boolean;
}
export default function (props: GridProps & ParentProps) {
  return (
    <div classList={{ [classes.grid]: true, [classes.gridCentered]: props.center ?? false }} class={props.class}>
      {props.children}
    </div>
  );
}

interface GridItemProps {
  span?: number;
  class?: string;
}
export function GridItem(props: GridItemProps & ParentProps) {
  return (
    <div classList={{ [classes.gridItem]: true }} class={props.class} style={{ '--spans': props.span ?? 1 }}>
      {props.children}
    </div>
  );
}
