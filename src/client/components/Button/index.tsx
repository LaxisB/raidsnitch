import { ParentProps } from 'solid-js';
import classes from './button.module.scss';

interface ButtonProps extends ParentProps {
    primary?: boolean;
    cta?: boolean;
    block?: boolean;
    ghost?: boolean;
    onclick?: () => void;
    class?: string;
}
export default (props: ButtonProps) => {
    return (
        <button
            classList={{
                [classes.button]: true,
                [classes.buttonBlock]: !!props.block,
                [classes.buttonGhost]: !!props.ghost,
                [classes.buttonPrimary]: !!props.primary,
                [classes.buttonCta]: !!props.cta,
            }}
            {...props}
        >
            {props.children}
        </button>
    );
};
