import Button from '../components/Button';
import Layout from '../components/Layout';
import { useStore } from '../store';

export default () => {
    const [_, actions] = useStore();
    return (
        <Layout centered>
            <h1>Select your Log dir</h1>
            <Button cta primary onclick={actions.fs.openFile}>
                select
            </Button>
        </Layout>
    );
};
