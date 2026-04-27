import * as XLSX from 'xlsx';
import { fileSystemService } from './fileSystemService';

export const excelService = {
  async registerAssignment(handle: FileSystemFileHandle, personIdentifier: string, sace: string) {
    try {
      const buffer = await fileSystemService.readFileAsBuffer(handle);
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = 'Registre';
      
      if (!workbook.Sheets[sheetName]) {
        // Fallback to first sheet if "Registre" doesn't exist? 
        // User says "already has its own header" and "always add to Registre".
        // If it doesn't exist, we might have an issue, but we'll try to find it.
        throw new Error('No s\'ha trobat el full "Registre" al fitxer d\'assignacions.');
      }

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      // Col A: ID, Col B: empty, Col C: SACE
      const newRow = [personIdentifier, '', sace];
      data.push(newRow);

      const newWorksheet = XLSX.utils.aoa_to_sheet(data);
      workbook.Sheets[sheetName] = newWorksheet;

      const newBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      await fileSystemService.writeFile(handle, newBuffer);
    } catch (error) {
      console.error('Error writing to assignment excel:', error);
      throw error;
    }
  },

  async registerStatus(handle: FileSystemFileHandle, sace: string, status: string) {
    try {
      const buffer = await fileSystemService.readFileAsBuffer(handle);
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = 'Registre';

      if (!workbook.Sheets[sheetName]) {
        throw new Error('No s\'ha trobat el full "Registre" al fitxer d\'estats.');
      }

      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Col A: empty, Col B: SACE, Col C: Estat
      const newRow = ['', sace, status];
      data.push(newRow);

      const newWorksheet = XLSX.utils.aoa_to_sheet(data);
      workbook.Sheets[sheetName] = newWorksheet;

      const newBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
      await fileSystemService.writeFile(handle, newBuffer);
    } catch (error) {
      console.error('Error writing to status excel:', error);
      throw error;
    }
  }
};
