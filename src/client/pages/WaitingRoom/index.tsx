import { useNavigate } from '@solidjs/router';
import { createEffect } from 'solid-js';
import Page from '../../components/Page';
import { useStore } from '../../store';

export default function () {
    const [store] = useStore();
    const navigate = useNavigate();

    if (!store.log.dirHandle) {
        navigate('/');
    }

    createEffect(() => {
        if (store.log.fileHandle) {
            navigate('/dashboard');
        }
    });

    return <Page centered>waiting for activity</Page>;
}
