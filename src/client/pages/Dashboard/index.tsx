import classes from './dashboard.module.scss';
import Debug from './modules/Debug';
import Log from './modules/Log';

export default () => {
    return (
        <div class={classes.dashboard}>
            <Log class={classes.frameLog} />
            <Debug class={`${classes.frame} ${classes.frameDebug}`} />
        </div>
    );
};
