import { ParentProps } from 'solid-js';
import './layout.scss';

interface LayoutProps extends ParentProps {
    centered?: boolean;
}
export default (props: LayoutProps) => {
    return (
        <div class="layout" classList={{ 'layout--centered': props.centered === true }}>
            {props.children}
        </div>
    );
};
