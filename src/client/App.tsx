import { Route, Routes } from '@solidjs/router';
import { Component, Show } from 'solid-js';
import './App.scss';
import Loading from './components/Loading';
import Theme from './components/Theme';
import Dashboard from './pages/Dashboard';
import FileSelect from './pages/FileSelect';
import WaitingRoom from './pages/WaitingRoom';
import { useStore } from './store';

const App: Component = () => {
  const [state] = useStore();

  return (
    <>
      <Theme>
        <Show when={state.ui.isLoading}>
          <Loading />
        </Show>
        <Routes>
          <Route path="/" component={FileSelect} />
          <Route path="/waiting" component={WaitingRoom} />
          <Route path="/dashboard" component={Dashboard} />
        </Routes>
      </Theme>
    </>
  );
};

export default App;
