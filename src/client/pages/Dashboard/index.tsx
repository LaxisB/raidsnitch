import { useStore } from '../../store';
import classes from './dashboard.module.scss';
import Actions from './modules/Actions';
import Debug from './modules/Debug';
import Log from './modules/Log';

export default () => {
    const [state] = useStore();
    return (
        <div class={classes.dashboard}>
            <Log class={classes.frameLog} />
            <div class={classes.frameStats}>
                <pre>{JSON.stringify(state.log.stats, null, 4)}</pre>
            </div>

            <div class={`${classes.frame} ${classes.frameDebug}`}>
                <Debug />
                <hr />
                <br />
                <Actions class={`${classes.frameActions}`} />
            </div>
        </div>
    );
};
