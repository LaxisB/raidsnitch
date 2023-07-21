import Grid, { GridItem } from '@/client/components/Grid';
import Layout from '@/client/components/Layout';
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
    <Layout centered>
      <Grid class={classes.fileselect}>
        <Show when={state.log.dirHandle}>
          <GridItem span={12} class={classes.continue}>
            <Button cta primary onclick={actions.log.restore}>
              resume
            </Button>
          </GridItem>
          <div class={classes.divider}>
            <span>or</span>
          </div>
        </Show>
        <GridItem class={classes.dir}>
          <a onclick={actions.log.watch}>select Directory</a>
        </GridItem>
        <GridItem class={classes.file} span={6}>
          <a onclick={actions.log.replay}>replay File</a>
        </GridItem>
      </Grid>
    </Layout>
  );
};
