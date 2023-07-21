import Button from '../../../components/Button';
import { useStore } from '../../../store';

export default function (props: any) {
  const [_, actions] = useStore();

  return (
    <div {...props}>
      <Button onclick={actions.log.watch}>watch directory</Button>
      <Button onclick={actions.log.replay}>replay file</Button>
      <Button primary onclick={actions.log.stop}>
        stop
      </Button>
    </div>
  );
}
