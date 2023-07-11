import { CoreInterface, LogStates } from './domain';
import { DirWatcher } from '../lib/fs/DirWatcher';
import { ReplayHandler } from '../lib/fs/ReplayHandler';
import { LiveHandler } from '../lib/fs/LiveHandler';
import { emitter } from './emitter';
import { Snitch, initialize as initializeSnitch } from '@raidsnitch/snitch';

let dirWatcher: DirWatcher | null = null;
let fileWatcher: ReplayHandler | null = null;
let snitch: Snitch;

function reset() {
  dirWatcher?.close();
  fileWatcher?.close();
  dirWatcher = null;
  fileWatcher = null;
  snitch = initializeSnitch((stats) => emitter.emit('stats', stats));
}

export const handlers: CoreInterface = {
  async restore() {
    reset();
    dirWatcher = new DirWatcher(new LiveHandler(snitch.handleEvents));
    await dirWatcher.restore();
  },

  async watchDirectory(handle: FileSystemDirectoryHandle) {
    reset();

    dirWatcher = new DirWatcher(new LiveHandler(snitch.handleEvents));
    dirWatcher.watchDirectory(handle);
  },
  async readFile(handle: FileSystemFileHandle) {
    reset();
    fileWatcher = new ReplayHandler(snitch.handleEvents);
    emitter.emit('dirWatcherState', LogStates.HAS_FILE);
    fileWatcher.handleFileChange(handle);
  },
  async stop() {
    dirWatcher?.close();
    fileWatcher?.close();
    reset();
    return 'ok';
  },
};
