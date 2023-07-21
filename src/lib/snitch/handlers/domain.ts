import { WowEvent } from '@/lib/parser';
import { State } from '..';

export type CreateHandler<T> = () => { initialState: T; handleEvent: HandlerCallback };
export type HandlerCallback = (event: WowEvent, state: State) => void;
