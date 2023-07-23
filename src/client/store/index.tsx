import { ParentProps, createContext, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Actions, State } from '../domain';
import * as dbg from './stores/debug';
import * as log from './stores/log';
import * as snitch from './stores/snitch';
import * as ui from './stores/ui';

const StoreContext = createContext<[State, Actions]>();

export function Provider(props: ParentProps) {
    const [state, setState] = createStore<State>({
        log: log.initialState,
        snitch: snitch.initialState,
        debug: dbg.initialState,
        ui: ui.initialState,
    });
    const actions = {} as any;
    log.createLogStore(actions, state, setState);
    snitch.createSnitchStore(actions, state, setState);
    dbg.createDebugStore(actions, state, setState);
    ui.createUiStore(actions, state, setState);

    (window as any).logs = { state, setState, actions };

    return <StoreContext.Provider value={[state, actions]}>{props.children}</StoreContext.Provider>;
}

export function useStore() {
    return useContext(StoreContext) as any as [State, Actions];
}
