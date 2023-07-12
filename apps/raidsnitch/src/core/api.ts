import { Snitch, initialize as initializeSnitch } from '@raidsnitch/snitch';
import { DirWatcher } from '../lib/fs/DirWatcher';
import { LiveHandler } from '../lib/fs/LiveHandler';
import { ReplayHandler } from '../lib/fs/ReplayHandler';
import { CoreInterface, LogStates } from './domain';
import { emitter } from './emitter';

let dirWatcher: DirWatcher | null = null;
let fileWatcher: ReplayHandler | null = null;
let snitch: Snitch;

const maybeEmit = (function () {
  let isEmitting = false;
  return function (state: Snitch['state']) {
    if (isEmitting) {
      return;
    }
    emitter.emit('stats', state);
    requestAnimationFrame(() => {
      isEmitting = false;
    });
  };
})();

function reset() {
  dirWatcher?.close();
  fileWatcher?.close();
  dirWatcher = null;
  fileWatcher = null;
  snitch = initializeSnitch(maybeEmit);
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
