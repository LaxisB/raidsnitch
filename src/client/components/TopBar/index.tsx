import { ParentProps } from 'solid-js';
import classes from './topbar.module.scss';
export const TopBar = function TopBar(props: ParentProps) {
    return <div class={classes.topbar}>{props.children}</div>;
};

TopBar.Left = function TopBarLeft(props: ParentProps) {
    return <div class={classes.left}>{props.children}</div>;
};
TopBar.Right = function TopBarRight(props: ParentProps) {
    return <div class={classes.right}>{props.children}</div>;
};
