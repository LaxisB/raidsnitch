import { useStore } from '@/client/store';
import styles from './loading.module.scss';
export default function () {
    const [state] = useStore();

    return (
        <div class={styles.wrapper}>
            <div class={styles.content}>
                <span class="message">{state.ui.message}</span>
            </div>
        </div>
    );
}
