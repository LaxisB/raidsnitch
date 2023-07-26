import { ParentProps, createEffect } from 'solid-js';
import classes from './page.module.scss';

interface PageProps extends ParentProps {
    title?: string;
    centered?: boolean;
}
export default (props: PageProps) => {
    createEffect(() => {
        document.title = props.title ?? 'Raidsnitch';
    });

    return (
        <div class={classes.page} classList={{ [classes.pageCentered]: props.centered === true }}>
            {props.children}
        </div>
    );
};
