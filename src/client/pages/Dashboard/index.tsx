import { useStore } from '../../store';
import classes from './dashboard.module.scss';
import Actions from './modules/Actions';
import DPS from './modules/DPS';
import Debug from './modules/Debug';

export default () => {
    const [state] = useStore();
    return (
        <div class={classes.dashboard}>
            <div class={`${classes.frame} ${classes.frameStats}`}>
                <header>encounter</header>
                <pre>{JSON.stringify(state.log.stats?.encounter, null, 4)}</pre>
                <header>dps</header>
                <pre>{JSON.stringify(state.log.stats?.dps, null, 4)}</pre>
                <header>entities</header>
                <pre>{JSON.stringify(state.log.stats?.entities, null, 4)}</pre>
            </div>
            <div class={`${classes.frame} ${classes.frameDebug}`}>
                <Debug />
                <hr />
                <br />
                <Actions class={`${classes.frameActions}`} />
            </div>
            <div class={`${classes.frame} ${classes.frameDamage}`}>
                <DPS mode="encounter" />
                <DPS mode="challengeMode" />
            </div>
            <div class={`${classes.frame} ${classes.frameHealing}`}>
                <header>healing</header>
            </div>
        </div>
    );
};
