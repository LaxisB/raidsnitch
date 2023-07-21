export enum LogStates {
  INITIAL = 'initial',
  NEED_DIR = 'need_dir',
  NEED_PERMISSION = 'need_permission',
  HAS_DIR = 'has_dir',
  HAS_FILE = 'has_file',
}

export interface FileHandler {
  handleFileChange(handle: FileSystemFileHandle): unknown;
  close(): Promise<void>;
}
