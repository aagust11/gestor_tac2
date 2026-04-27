/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/// <reference types="wicg-file-system-access" />

export const fileSystemService = {
  isSupported() {
    return 'showOpenFilePicker' in window;
  },

  async getFileHandle(options: OpenFilePickerOptions = {}) {
    try {
      const [handle] = await window.showOpenFilePicker(options);
      return handle;
    } catch (error) {
      if ((error as Error).name === 'AbortError') return null;
      throw error;
    }
  },

  async createNewFileHandle(options: SaveFilePickerOptions = {}) {
    try {
      return await window.showSaveFilePicker(options);
    } catch (error) {
      if ((error as Error).name === 'AbortError') return null;
      throw error;
    }
  },

  async verifyPermission(fileHandle: FileSystemFileHandle, readWrite: boolean = false) {
    const opts: FileSystemHandlePermissionDescriptor = { mode: readWrite ? 'readwrite' : 'read' };
    if ((await fileHandle.queryPermission(opts)) === 'granted') {
      return true;
    }
    if ((await fileHandle.requestPermission(opts)) === 'granted') {
      return true;
    }
    return false;
  },

  async readFileAsText(fileHandle: FileSystemFileHandle): Promise<string> {
    const file = await fileHandle.getFile();
    return await file.text();
  },

  async readFileAsBuffer(fileHandle: FileSystemFileHandle): Promise<ArrayBuffer> {
    const file = await fileHandle.getFile();
    return await file.arrayBuffer();
  },

  async writeFile(fileHandle: FileSystemFileHandle, content: string | ArrayBuffer) {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }
};
