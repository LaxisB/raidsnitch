import { wrapLog } from '@raidsnitch/shared/log';
import { get, set } from 'idb-keyval';
import { batch } from 'solid-js';
import { DirWatcher } from '../../../lib/fs/DirWatcher';
import { LiveHandler } from '../../../lib/fs/LiveHandler';
import { ReplayHandler } from '../../../lib/fs/ReplayHandler';
import type { StoreEnhancer } from '../../domain';

export interface LogActions {
  restore(): Promise<void>;
  reset(): void;
  watch(): Promise<void>;
  replay(): Promise<void>;
  stop(): Promise<void>;
}
export interface LogState {
  isReading: boolean;
  startTime: number;
  readTime: number;
}

export const initialState: LogState = {
  isReading: false,
  startTime: 0,
  readTime: 0,
};

const refresh = async () => {
  const dirHandle = await get<FileSystemDirectoryHandle>('dirHandle');
  if (dirHandle) {
    await dirHandle.requestPermission();
  }
  return dirHandle;
};

export const createLogStore: StoreEnhancer = function (actions, state, setState) {
  let dirWatcher: DirWatcher | null = null;
  let fileWatcher: ReplayHandler | null = null;
  const log = wrapLog('log store');
  actions.log = {
    reset() {
      dirWatcher?.close();
      fileWatcher?.close();
      dirWatcher = null;
      fileWatcher = null;
      actions.snitch.reset();

      batch(() => {
        setState('log', 'isReading', false);
        setState('log', 'startTime', 0);
        setState('ui', 'viewstate', 'initial');
      });
    },
    async restore() {
      await refresh();
      actions.log.reset();
      dirWatcher = new DirWatcher(new LiveHandler(actions));
      await dirWatcher.restore();
    },
    async watch() {
      let handle: FileSystemDirectoryHandle | undefined;
      const supportsFS = 'showDirectoryPicker' in window;
      if (!supportsFS) {
        log.log("file picker isn't supported");
        return;
      }
      handle = await window.showDirectoryPicker();
      if (!handle) {
        log.warn('cancelled watching directory');
        return;
      }
      set('dirHandle', handle);
      actions.log.reset();

      dirWatcher = new DirWatcher(new LiveHandler(actions));
      dirWatcher.watchDirectory(handle);
      batch(() => {
        setState('log', 'isReading', true);
        setState('log', 'startTime', Date.now());
        setState('ui', 'viewstate', 'ready');
      });
    },
    async replay() {
      let handle: FileSystemFileHandle | undefined;
      const supportsFS = 'showDirectoryPicker' in window;
      if (!supportsFS) {
        log.log("file picker isn't supported");
        return;
      }
      [handle] = await window.showOpenFilePicker();

      if (!handle) {
        log.warn('cancelled file selection');
        return;
      }

      actions.log.reset();
      fileWatcher = new ReplayHandler(actions);
      fileWatcher.handleFileChange(handle);
      batch(() => {
        setState('log', 'isReading', true);
        setState('log', 'startTime', Date.now());
        setState('ui', 'viewstate', 'ready');
      });
    },
    async stop() {
      dirWatcher?.close();
      fileWatcher?.close();
      actions.log.reset();
    },
  };
};
