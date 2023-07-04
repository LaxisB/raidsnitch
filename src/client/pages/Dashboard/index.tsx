import { useStore } from '../../store';
import classes from './dashboard.module.scss';
import Debug from './modules/Debug';
import Log from './modules/Log';

export default () => {
    const [store] = useStore();

    return (
        <div class={classes.dashboard}>
            {store.log.isReading === false ? <Log class={classes.frameLog} /> : null}
            <Debug class={`${classes.frame} ${classes.frameDebug}`} />
        </div>
    );
};
