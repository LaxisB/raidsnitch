import { JSX } from 'solid-js/h/jsx-runtime';
import classes from './button.module.scss';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    kind?: 'primary' | 'secondary' | 'accent';
    style?: 'cta' | 'ghost';
    block?: boolean;
}
export default (props: ButtonProps) => {
    const { kind, style, block, ...rest } = props;
    return (
        <button
            classList={{
                [classes.button]: true,
                [classes.buttonBlock]: !!block,
                [classes.buttonGhost]: style === 'ghost',
                [classes.buttonCta]: style === 'cta',
                [classes.buttonPrimary]: kind === 'primary',
                [classes.buttonSecondary]: kind === 'secondary',
                [classes.buttonAccent]: kind === 'accent',
            }}
            {...rest}
        >
            {props.children as any}
        </button>
    );
};
