import { useNavigate } from '@solidjs/router';
import { createEffect } from 'solid-js';
import Layout from '../../components/Layout';
import { useStore } from '../../store';

export default function () {
  const [store] = useStore();
  const navigate = useNavigate();

  if (!store.log.dirHandle) {
    navigate('/');
  }

  createEffect(() => {
    if (store.log.isReading) {
      navigate('/dashboard');
    }
  });

  return <Layout centered>waiting for activity</Layout>;
}
