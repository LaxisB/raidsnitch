import { Route, Routes } from '@solidjs/router';
import { Component } from 'solid-js';
import './App.scss';
import Theme from './components/Theme';
import Dashboard from './pages/Dashboard';
import FileSelect from './pages/FileSelect';
import { useStore } from './store';

const App: Component = () => {
  const [state] = useStore();

  return (
    <>
      <Theme>
        <Routes>
          <Route path="/" component={FileSelect} />
          <Route path="/dashboard" component={Dashboard} />
        </Routes>
      </Theme>
    </>
  );
};

export default App;
