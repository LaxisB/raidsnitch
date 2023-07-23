import { StoreEnhancer } from '@/client/domain';

export interface UiState {
    loading: number;
    message: string;
    isLoading: boolean;
}
export interface UiActions {
    incLoading(msg?: string): void;
    decLoading(): void;
}

export const initialState: UiState = {
    loading: 0,
    message: '',
    get isLoading() {
        return this.loading > 0;
    },
};

export const createUiStore: StoreEnhancer = function (actions, state, setState) {
    actions.ui = {
        incLoading(msg?: string) {
            setState('ui', 'loading', (old) => old + 1);
            setState('ui', 'message', msg || 'Loading...');
        },
        decLoading() {
            setState('ui', 'loading', (old) => Math.max(0, old - 1));
        },
    };
};
