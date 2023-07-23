import { ParentProps } from 'solid-js';
import classes from './button.module.scss';

interface ButtonProps extends ParentProps {
    primary?: boolean;
    cta?: boolean;
    onclick?: () => void;
    class?: string;
}
export default (props: ButtonProps) => {
    return (
        <button
            classList={{ [classes.button]: true, [classes.buttonPrimary]: !!props.primary, [classes.buttonCta]: !!props.cta }}
            {...props}
        >
            {props.children}
        </button>
    );
};
