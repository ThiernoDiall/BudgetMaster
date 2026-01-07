import * as XLSX from 'xlsx';
import { BudgetRow } from '../types';

export interface RawRow {
  [key: string]: any;
}

export const readExcelFile = (file: File): Promise<any[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Aucune donnée trouvée dans le fichier");
        
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const parseDate = (value: any): string | null => {
  if (value === null || value === undefined || value === '') return null;
  
  // Normalisation du nombre d'Excel (ex: 45992) même si c'est une string
  let numericValue: number | null = null;
  if (typeof value === 'number') {
    numericValue = value;
  } else if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    numericValue = parseInt(value.trim());
  }

  if (numericValue !== null) {
    try {
      // Formule conversion Excel Date Serial -> JS Date
      const date = new Date((numericValue - (25567 + 1)) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  }

  if (typeof value === 'string') {
    let str = value.trim();
    if (!str) return null;

    const normalized = str.replace(/[\/\.]/g, '-');

    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(normalized)) {
      const parts = normalized.split('-');
      const y = parts[0];
      const m = parts[1].padStart(2, '0');
      const d = parts[2].padStart(2, '0');
      const iso = `${y}-${m}-${d}`;
      const testDate = new Date(iso);
      if (!isNaN(testDate.getTime())) return iso;
    }

    const dmyMatch = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmyMatch) {
      const [_, d, m, y] = dmyMatch;
      const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      const testDate = new Date(iso);
      if (!isNaN(testDate.getTime())) return iso;
    }

    const nativeDate = new Date(str);
    if (!isNaN(nativeDate.getTime())) {
      return nativeDate.toISOString().split('T')[0];
    }
  }

  return null;
};

export const parseAmount = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    let clean = value.trim();
    clean = clean.replace(/[\s\xa0\$€£]/g, '');
    
    if (clean.includes(',') && !clean.includes('.')) {
      clean = clean.replace(',', '.');
    } 
    else if (clean.includes(',') && clean.includes('.')) {
      const lastComma = clean.lastIndexOf(',');
      const lastDot = clean.lastIndexOf('.');
      if (lastComma > lastDot) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    }

    const cleanNumeric = clean.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanNumeric);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};

export const checkIsDuplicate = (
  newDate: string,
  newAmount: number,
  newDesc: string,
  existingRows: BudgetRow[]
): boolean => {
  if (!existingRows || existingRows.length === 0) return false;

  const targetDesc = newDesc.toLowerCase().trim();
  const targetAmount = Math.abs(newAmount);

  return existingRows.some(row => {
    const rowAmount = Math.abs(row.actual);
    const rowDesc = (row.description || '').toLowerCase().trim();
    
    if (Math.abs(rowAmount - targetAmount) > 0.001) return false;
    if (!rowDesc.includes(targetDesc) && !targetDesc.includes(rowDesc)) return false;

    return true;
  });
};