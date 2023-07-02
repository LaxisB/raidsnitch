import { get } from 'idb-keyval';
import { LogStates } from '../../core/domain';
import { ClientState, StoreEnhancer } from '../domain';
import { wrapLog } from '../../lib/log';

export interface FsActions {
    refreshPermissions(): Promise<FileSystemDirectoryHandle | undefined>;
    openFile(): Promise<void>;
}

export const initialState: ClientState['fs'] = {
    state: LogStates.INITIAL,
};

export const createFsStore: StoreEnhancer = function (worker, actions, state, setState) {
    const log = wrapLog('fs store');
    const refreshPermissions = async () => {
        const dirHandle = await get<FileSystemDirectoryHandle>('dirHandle');
        if (dirHandle) {
            await dirHandle.requestPermission();
        }
        return dirHandle;
    };

    actions.fs = {
        refreshPermissions: async () => {
            const dirHandle = await refreshPermissions();
            if (dirHandle) {
                await worker.watchDirectory(dirHandle);
            }
        },
        openFile: async () => {
            let handle: FileSystemHandle | undefined;
            const supportsFS = 'showDirectoryPicker' in window;
            if (!supportsFS) {
                log.log("file picker isn't supported");
                return;
            }
            handle = await window.showDirectoryPicker();

            if (handle) {
                await worker.watchDirectory(handle as any);
            }
        },
    } as FsActions;

    worker.on('state', (state) => {
        log.debug('new fs state', state);
        setState('fs', 'state', state);
    });
};
