import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ExcelImportResult {
  success: boolean;
  data: any[];
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class ExcelService {
  
  parseExcel(file: File): Promise<ExcelImportResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const errors: string[] = [];

      reader.onload = (event: any) => {
        try {
          const bstr: string = event.target.result;
          const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
          const wsname: string = wb.SheetNames[0];
          const ws: XLSX.WorkSheet = wb.Sheets[wsname];
          const data: any[] = XLSX.utils.sheet_to_json(ws);

          if (data.length === 0) {
            errors.push('No data found in Excel file');
          }

          resolve({
            success: errors.length === 0,
            data,
            errors,
          });
        } catch (error: any) {
          errors.push(`Error parsing file: ${error.message}`);
          resolve({ success: false, data: [], errors });
        }
      };

      reader.readAsBinaryString(file);
    });
  }

  downloadSampleExcel(type: 'customers' | 'distributors' | 'items'): void {
    const samples = {
      customers: [
        {
          name: 'Customer One',
          email: 'customer1@example.com',
          phone: '9000000001',
          address: 'Address 1',
          city: 'City 1',
          state: 'State 1',
          pincode: '123456',
        },
        {
          name: 'Customer Two',
          email: 'customer2@example.com',
          phone: '9000000002',
          address: 'Address 2',
          city: 'City 2',
          state: 'State 2',
          pincode: '234567',
        },
      ],
      distributors: [
        {
          businessName: 'Dist Business One',
          ownerName: 'Owner One',
          phone: '9000000001',
          email: 'dist1@example.com',
          gstin: '22AAAAA0000A1Z5',
          address: 'Address 1',
          city: 'City 1',
          state: 'State 1',
        },
        {
          businessName: 'Dist Business Two',
          ownerName: 'Owner Two',
          phone: '9000000002',
          email: 'dist2@example.com',
          gstin: '22BBBBB0000B2Z5',
          address: 'Address 2',
          city: 'City 2',
          state: 'State 2',
        },
      ],
      items: [
        {
          name: 'Item 1',
          unit: 'pcs',
          rate: 100.0,
          qty: 500,
          hsn: '6204',
          sac: '',
          gstRate: 18,
          sku: 'SKU001',
          description: 'Item description',
        },
        {
          name: 'Item 2',
          unit: 'box',
          rate: 500.0,
          qty: 100,
          hsn: '6204',
          sac: '',
          gstRate: 18,
          sku: 'SKU002',
          description: 'Item description',
        },
      ],
    };

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(samples[type]);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `sample-${type}.xlsx`);
  }

  exportToExcel(data: any[], fileName: string): void {
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }
}
