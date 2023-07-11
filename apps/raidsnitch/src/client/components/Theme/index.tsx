import { ParentProps } from 'solid-js';
import './theme.scss';

export default (props: ParentProps) => {
  return <div class="theme dark">{props.children}</div>;
};
