import clsx from 'clsx';
import { ParentProps, createEffect } from 'solid-js';
import classes from './page.module.scss';

interface PageProps extends ParentProps {
    title?: string;
    centered?: boolean;
    class?: string;
}
export default (props: PageProps) => {
    createEffect(() => {
        document.title = props.title ?? 'Raidsnitch';
    });

    return (
        <div class={clsx(classes.page, props.class)} classList={{ [classes.pageCentered]: props.centered === true }}>
            {props.children}
        </div>
    );
};
