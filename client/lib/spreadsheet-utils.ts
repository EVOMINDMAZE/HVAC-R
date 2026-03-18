import * as XLSX from 'xlsx';

/**
 * Parse an XLSX file and convert to array of objects (first row as headers).
 * Compatible with CSV parsing output format.
 */
export async function parseXLSXFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                if (!data) {
                    reject(new Error('Failed to read file'));
                    return;
                }
                const workbook = XLSX.read(data, { type: 'array' });
                // Get first worksheet name
                const sheetName = workbook.SheetNames[0];
                if (!sheetName) {
                    reject(new Error('No worksheets found in file'));
                    return;
                }
                const worksheet = workbook.Sheets[sheetName];
                // Convert to JSON (array of objects)
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                if (rows.length === 0) {
                    reject(new Error('No data found in worksheet'));
                    return;
                }
                // First row as headers
                const headers = rows[0] as string[];
                // Convert remaining rows to objects
                const result = rows.slice(1).map(row => {
                    const obj: any = {};
                    headers.forEach((header, idx) => {
                        obj[header] = row[idx] ?? '';
                    });
                    return obj;
                });
                resolve(result);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Determine if a file is an XLSX file based on extension or MIME type.
 */
export function isXLSXFile(file: File): boolean {
    return file.name.toLowerCase().endsWith('.xlsx') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}