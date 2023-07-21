import { Component, Match, Switch } from 'solid-js';
import './App.scss';
import Theme from './components/Theme';
import Dashboard from './pages/Dashboard';
import FileSelect from './pages/FileSelect';
import Reauth from './pages/ReAuth';
import { useStore } from './store';

const App: Component = () => {
  const [state] = useStore();

  return (
    <>
      <Theme>
        <Switch>
          <Match when={state.ui.viewstate === 'initial'}>
            <FileSelect />1
          </Match>
          <Match when={state.ui.viewstate === 'need_file'}>
            <FileSelect />
          </Match>
          <Match when={state.ui.viewstate === 'need_permisison'}>
            <Reauth />
          </Match>
          <Match when={state.ui.viewstate === 'ready'}>
            <Dashboard />
          </Match>
        </Switch>
      </Theme>
    </>
  );
};

export default App;
