import './App.scss';
import { Component, Show, Switch, Match } from 'solid-js';
import { useStore } from './store';
import FileSelect from './pages/FileSelect';
import Reauth from './pages/ReAuth';
import Theme from './components/Theme';

const App: Component = () => {
    const [state] = useStore();

    return (
        <>
            <Theme>
                <Show when={state.ready}>
                    <Switch>
                        <Match when={state.ui.viewstate === 'initial'}>&nbsp;</Match>
                        <Match when={state.ui.viewstate === 'need_file'}>
                            <FileSelect />
                        </Match>
                        <Match when={state.ui.viewstate === 'need_permisison'}>
                            <Reauth />
                        </Match>
                        <Match when={state.ui.viewstate === 'ready'}>
                            <div class="page">welcome back</div>
                        </Match>
                    </Switch>
                </Show>
            </Theme>
        </>
    );
};

export default App;
