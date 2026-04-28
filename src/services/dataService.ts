import { AppData } from '../types';
import { fileSystemService } from './fileSystemService';

const EMPTY_DATA: AppData = {
  devices: [],
  people: [],
  assignments: [],
  incidents: [],
  incidentTemplates: [],
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
      if (!data || typeof data !== 'object') {
        return EMPTY_DATA;
      }

      const safeData: AppData = {
        devices: Array.isArray(data.devices) ? data.devices : [],
        people: Array.isArray(data.people) ? data.people : [],
        assignments: Array.isArray(data.assignments) ? data.assignments : [],
        incidents: Array.isArray(data.incidents) ? data.incidents : [],
        incidentTemplates: Array.isArray(data.incidentTemplates) ? data.incidentTemplates : [],
        metadata: {
          version:
            data.metadata && typeof data.metadata.version === 'string'
              ? data.metadata.version
              : EMPTY_DATA.metadata.version,
          updatedAt:
            data.metadata && typeof data.metadata.updatedAt === 'string'
              ? data.metadata.updatedAt
              : new Date().toISOString(),
        },
      };

      return safeData;
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
