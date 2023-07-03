import { ParentProps } from 'solid-js';
import classes from './button.module.scss';

interface ButtonProps extends ParentProps {
    primary?: boolean;
    cta?: boolean;
    onclick?: () => void;
}
export default (props: ButtonProps) => {
    return (
        <button
            class={classes.button}
            classList={{ [classes.buttonPrimary]: !!props.primary, [classes.buttonCta]: !!props.cta }}
            onclick={props.onclick}
        >
            {props.children}
        </button>
    );
};
