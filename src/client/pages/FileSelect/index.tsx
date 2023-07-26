import Grid, { GridItem } from '@/client/components/Grid';
import Page from '@/client/components/Page';
import { useNavigate } from '@solidjs/router';
import { Show } from 'solid-js';
import Button from '../../components/Button';
import { useStore } from '../../store';
import classes from './fileselect.module.scss';

export default () => {
    const [state, actions] = useStore();
    const navigate = useNavigate();
    if (state.log.fileHandle) {
        navigate('/dashboard');
    }

    return (
        <Page centered>
            <Grid class={classes.fileselect}>
                <Show when={state.log.dirHandle}>
                    <GridItem span={12} class={classes.continue}>
                        <Button block style="cta" kind="primary" onclick={actions.log.restore}>
                            resume
                        </Button>
                    </GridItem>
                    <div class={classes.divider}>
                        <span>or</span>
                    </div>
                </Show>
                <GridItem class={classes.dir}>
                    <Button block kind="primary" onclick={actions.log.watch}>
                        select Directory
                    </Button>
                </GridItem>
                <GridItem class={classes.file} span={6}>
                    <Button block style="ghost" onclick={actions.log.replay}>
                        replay File
                    </Button>
                </GridItem>
            </Grid>
        </Page>
    );
};
