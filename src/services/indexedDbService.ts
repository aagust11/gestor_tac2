import { get, set, del } from 'idb-keyval';

const HANDLES_KEY = 'file_handles';

export const indexedDbService = {
  async saveHandle(key: string, handle: FileSystemFileHandle) {
    const handles = (await get(HANDLES_KEY)) || {};
    handles[key] = handle;
    await set(HANDLES_KEY, handles);
  },

  async getHandle(key: string): Promise<FileSystemFileHandle | null> {
    const handles = await get(HANDLES_KEY);
    return handles ? handles[key] : null;
  },

  async getAllHandles(): Promise<Record<string, FileSystemFileHandle>> {
    return (await get(HANDLES_KEY)) || {};
  },

  async removeHandle(key: string) {
    const handles = await get(HANDLES_KEY);
    if (handles) {
      delete handles[key];
      await set(HANDLES_KEY, handles);
    }
  },

  async clearAll() {
    await del(HANDLES_KEY);
  }
};
