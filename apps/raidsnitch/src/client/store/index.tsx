import { ParentProps, createContext, createSignal, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';
import { getWorker } from './worker';
import { initialState as uiState, createUiStore } from './createUiStore';
import { initialState as logState, createLogStore } from './createLogStore';
import { ClientActions, ClientState } from '../domain';

const StoreContext = createContext<[ClientState, ClientActions]>();
export function Provider(props: ParentProps) {
  const worker = getWorker();
  const [state, setState] = createStore<ClientState>({
    ui: uiState,
    log: logState,
    ready: false,
  });
  const actions = {} as any;
  createUiStore(worker, actions, state, setState);
  createLogStore(worker, actions, state, setState);

  worker.restore().then(() => setState('ready', true));
  (window as any).logs = { worker, state, setState, actions };
  return <StoreContext.Provider value={[state, actions]}>{props.children}</StoreContext.Provider>;
}

export function useStore() {
  return useContext(StoreContext) as any as [ClientState, ClientActions];
}
