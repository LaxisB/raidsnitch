import { State } from '..';
import { GlobalEvents, WowEvent } from '../events';

export type CreateHandler<T> = () => { initialState: T; handleEvent: HandlerCallback };
export type HandlerCallback = (event: WowEvent, state: State) => void;
