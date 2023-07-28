import clsx from 'clsx';
import { ParentProps } from 'solid-js';
import classes from './topbar.module.scss';

interface TopBarProps extends ParentProps{
    class?: string;
}
export const TopBar = function TopBar(props: TopBarProps) {
    return <div class={clsx(classes.topbar, props.class)}>{props.children}</div>;
};

TopBar.Left = function TopBarLeft(props: ParentProps) {
    return <div class={classes.left}>{props.children}</div>;
};
TopBar.Right = function TopBarRight(props: ParentProps) {
    return <div class={classes.right}>{props.children}</div>;
};
