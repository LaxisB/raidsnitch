import { Emitter } from '@raidsnitch/shared/emitter';
import { CoreEvents } from './domain';

export const emitter = new Emitter<CoreEvents>();
