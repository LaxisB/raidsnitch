import Button from '../components/Button';
import Layout from '../components/Layout';
import { useStore } from '../store';

export default () => {
  const [_, actions] = useStore();
  return (
    <Layout centered>
      <Button cta primary onclick={actions.log.refreshPermissions}>
        reauth
      </Button>
    </Layout>
  );
};
