import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'inrFormat',
  standalone: true
})
export class InrFormatPipe implements PipeTransform {
  transform(value: any): string {
    if (value === null || value === undefined || value === '') return '₹0';
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '₹0';
    if (numValue === 0) return '₹0';
    
    const isNegative = numValue < 0;
    const absValue = Math.abs(numValue);
    
    let result = '';
    if (absValue >= 10000000) {
      result = (absValue / 10000000).toFixed(2) + ' Cr';
    } else if (absValue >= 100000) {
      result = (absValue / 100000).toFixed(2) + ' L';
    } else {
      result = absValue.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    
    return (isNegative ? '-' : '') + '₹' + result;
  }
}
