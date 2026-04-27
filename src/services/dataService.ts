import { AppData } from '../types';
import { fileSystemService } from './fileSystemService';

const EMPTY_DATA: AppData = {
  devices: [],
  people: [],
  assignments: [],
  incidents: [],
  metadata: {
    version: '1.0.0',
    updatedAt: new Date().toISOString()
  }
};

export const dataService = {
  async loadData(handle: FileSystemFileHandle): Promise<AppData> {
    try {
      const content = await fileSystemService.readFileAsText(handle);
      if (!content.trim()) return EMPTY_DATA;
      
      const data = JSON.parse(content);
      // Basic structure validation
      if (!data.devices || !data.people || !data.assignments || !data.incidents) {
        return EMPTY_DATA;
      }
      return data;
    } catch (error) {
      console.error('Error loading JSON data:', error);
      return EMPTY_DATA;
    }
  },

  async saveData(handle: FileSystemFileHandle, data: AppData) {
    try {
      const updatedData = {
        ...data,
        metadata: {
          ...data.metadata,
          updatedAt: new Date().toISOString()
        }
      };
      const content = JSON.stringify(updatedData, null, 2);
      await fileSystemService.writeFile(handle, content);
      return updatedData;
    } catch (error) {
      console.error('Error saving JSON data:', error);
      throw error;
    }
  },

  getEmptyData(): AppData {
    return { ...EMPTY_DATA, metadata: { ...EMPTY_DATA.metadata, updatedAt: new Date().toISOString() } };
  }
};
