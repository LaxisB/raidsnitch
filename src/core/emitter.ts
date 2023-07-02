import { Emitter } from '../lib/emitter';
import { CoreEvents } from './domain';

export const emitter = new Emitter<CoreEvents>();
