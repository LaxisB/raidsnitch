import clsx from 'clsx';
import { JSX, ParentProps } from 'solid-js';
import classes from './select.module.scss';

export const Select = function Select(props: JSX.HTMLAttributes<HTMLSelectElement> & ParentProps) {
    return (
        <select {...props} class={clsx(classes.select, props.class, props.classList)}>
            {props.children}
        </select>
    );
};
