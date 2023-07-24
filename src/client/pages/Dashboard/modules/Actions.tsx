import Grid from '@/client/components/Grid';
import Button from '../../../components/Button';
import { useStore } from '../../../store';

export default function (props: any) {
    const [_, actions] = useStore();

    return (
        <Grid {...props}>
            <Button onclick={actions.log.watch}>watch directory</Button>
            <Button onclick={actions.log.replay}>replay file</Button>
            <Button primary onclick={actions.log.stop}>
                stop
            </Button>
        </Grid>
    );
}
