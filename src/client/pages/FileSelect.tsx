import { useNavigate } from '@solidjs/router';
import Button from '../components/Button';
import Layout from '../components/Layout';
import { useStore } from '../store';

export default () => {
  const [state, actions] = useStore();
  const navigate = useNavigate();
  if (state.log.isReading) {
    navigate('/dashboard');
  }
  return (
    <Layout centered>
      <Button cta primary onclick={actions.log.watch}>
        set log dir
      </Button>
      <br />
      or
      <br />
      <Button cta onclick={actions.log.replay}>
        select File
      </Button>
    </Layout>
  );
};
