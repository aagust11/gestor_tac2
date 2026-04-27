/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';

export const csvService = {
  parseExcel: async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          // Normalize keys to lowercase to match our system
          const normalized = json.map((row: any) => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
              newRow[key.toLowerCase().trim()] = row[key];
            });
            return newRow;
          });
          
          resolve(normalized);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  },

  parseCSV: (text: string) => {
    // Detect separator (sometimes it's ; in Spanish/Catalan locales)
    const firstLine = text.split('\n')[0];
    const separator = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    
    // Improved CSV split that respects quotes
    const splitCSV = (line: string) => {
      const result = [];
      let cell = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === separator && !inQuotes) {
          result.push(cell.trim().replace(/^"|"$/g, ''));
          cell = '';
        } else {
          cell += char;
        }
      }
      result.push(cell.trim().replace(/^"|"$/g, ''));
      return result;
    };

    const headers = splitCSV(lines[0]).map(h => h.toLowerCase().trim());
    return lines.slice(1).map(line => {
      const values = splitCSV(line);
      const obj: any = {};
      headers.forEach((h, i) => {
        obj[h] = values[i];
      });
      return obj;
    });
  },
  
  generateTemplate: (headers: string[]) => {
    return headers.join(',') + '\n' + headers.map(h => `ex_val_${h}`).join(',');
  },
  
  downloadTemplate: (filename: string, headers: string[]) => {
    const content = csvService.generateTemplate(headers);
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
