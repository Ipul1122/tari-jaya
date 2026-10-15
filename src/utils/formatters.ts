const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID');

export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return 'Rp 0';
  return currencyFormatter.format(amount);
}

export function formatNumber(val: number): string {
  if (isNaN(val)) return '0';
  return numberFormatter.format(val);
}

/**
 * Format angka atau string angka ke format ribuan rupiah Indonesia (pemisah ribuan titik).
 * Contoh: 10000 -> "10.000", 1500000 -> "1.500.000", "" -> ""
 */
export function formatRupiahInput(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const cleanStr = String(value).replace(/\D/g, '');
  if (!cleanStr) return '';
  const num = parseInt(cleanStr, 10);
  if (isNaN(num)) return '';
  return numberFormatter.format(num);
}

/**
 * Parsing string berformat ribuan rupiah kembali ke integer number.
 * Contoh: "10.000" -> 10000, "1.500.000" -> 1500000, "Rp 10.000" -> 10000, "" -> 0
 */
export function parseRupiahInput(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return isNaN(value) ? 0 : Math.round(value);
  const cleanStr = String(value).replace(/\D/g, '');
  if (!cleanStr) return 0;
  const num = parseInt(cleanStr, 10);
  return isNaN(num) ? 0 : num;
}

export function isLowStock(stock: number): boolean {
  // Statis <= 9 unit (< 10 barang) sesuai blueprint directive
  return stock <= 9;
}

export function isCriticalStock(stock: number): boolean {
  return stock <= 3;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '';
  return `${formatDate(isoString)}, ${formatTime(isoString)}`;
}

export function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
