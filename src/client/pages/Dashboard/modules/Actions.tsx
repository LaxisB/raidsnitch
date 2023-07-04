import Button from '../../../components/Button';
import { useStore } from '../../../store';

export default function (props: any) {
    const [_, actions] = useStore();

    return (
        <div {...props}>
            <Button onclick={actions.log.watchFolder}>watch directory</Button>
            <Button onclick={actions.log.openFile}>replay file</Button>
            <Button primary onclick={actions.log.stop}>
                stop
            </Button>
        </div>
    );
}
