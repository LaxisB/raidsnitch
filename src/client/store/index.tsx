import { ParentProps, createContext, createSignal, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { getWorker } from './worker';
import { initialState as uiState, createUiStore } from './createUiStore';
import { initialState as fsState, createFsStore } from './createFsStore';
import { ClientActions, ClientState } from '../domain';

const StoreContext = createContext<[ClientState, ClientActions]>();
export function Provider(props: ParentProps) {
    const worker = getWorker();
    const [state, setState] = createStore<ClientState>({
        ui: uiState,
        fs: fsState,
        ready: false,
    });
    const actions = {} as any;
    createUiStore(worker, actions, state, setState);
    createFsStore(worker, actions, state, setState);

    worker.restore().then((res) => setState('ready', true));
    return <StoreContext.Provider value={[state, actions]}>{props.children}</StoreContext.Provider>;
}

export function useStore() {
    return useContext(StoreContext) as any as [ClientState, ClientActions];
}
