import clsx from 'clsx';
import { JSX, ParentProps } from 'solid-js';
import classes from './grid.module.scss';

interface GridProps extends JSX.HTMLAttributes<HTMLDivElement> {
    center?: boolean;
}
export default function (props: GridProps & ParentProps) {
    const { class: className, center, ...rest } = props;
    return (
        <div class={clsx(className, classes.grid, props.center && classes.gridCentered)} {...rest}>
            {props.children}
        </div>
    );
}

interface GridItemProps {
    span?: number;
    col?: number;
    row?: number;
    rowspan?: number;
    class?: string;
}
export function GridItem(props: GridItemProps & ParentProps) {
    return (
        <div
            class={clsx(props.class, classes.item)}
            style={{
                '--col': props.col ?? 'auto',
                '--colspan': props.span ?? 1,
                '--row': props.row ?? 'auto',
                '--rowspan': props.rowspan ?? 1,
            }}
        >
            {props.children}
        </div>
    );
}
