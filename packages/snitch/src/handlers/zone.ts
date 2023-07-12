import type { State } from '..';
import { WowEvent, casts } from '../events';
import { CreateHandler } from './domain';
export interface ZoneState {
  name: string;
  id: number;
}

export const createZoneHandler: CreateHandler<ZoneState> = () => {
  let initialState: ZoneState = {
    name: '',
    id: 0,
  };

  function handleEvent(event: WowEvent, state: State) {
    if (casts.eventIsZoneChange(event)) {
      state.zone = {
        name: event.untyped[1],
        id: event.untyped[2],
      };
    }
  }
  return {
    initialState,
    handleEvent,
  };
};
