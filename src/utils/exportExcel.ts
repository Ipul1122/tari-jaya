import * as XLSX from 'xlsx';
import { db } from '../db/schema';
import type { StockMutation, Product, Category } from '../db/schema';
import { formatDate, formatDateTime } from './formatters';

interface ExportDataParams {
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  mutations: StockMutation[];
}

export async function exportReportsToExcel(params: ExportDataParams): Promise<string> {
  const { periodLabel, startDate, endDate, mutations } = params;

  // 1. Ambil data produk & kategori terkini dari database
  const allProducts: Product[] = await db.products.toArray();
  const allCategories: Category[] = await db.categories.toArray();

  const categoryMap = new Map<number, string>();
  allCategories.forEach((c) => {
    if (c.id) categoryMap.set(c.id, c.name);
  });

  const productMap = new Map<number, Product>();
  allProducts.forEach((p) => {
    if (p.id) productMap.set(p.id, p);
  });

  // 2. Hitung ringkasan finansial mutasi yang difilter
  let totalInQty = 0;
  let totalInValue = 0;
  let totalOutQty = 0;
  let totalOutValue = 0;
  let totalGrossProfit = 0;

  for (const m of mutations) {
    if (m.type === 'IN') {
      totalInQty += m.quantity;
      totalInValue += m.quantity * m.unit_cost;
    } else if (m.type === 'OUT') {
      totalOutQty += m.quantity;
      totalOutValue += m.quantity * m.unit_price;
      totalGrossProfit += m.gross_profit;
    }
  }

  const netCashflow = totalOutValue - totalInValue;
  const marginPercentage = totalOutValue > 0 ? ((totalGrossProfit / totalOutValue) * 100).toFixed(1) + '%' : '0%';

  // ----------------------------------------------------
  // Sheet 1: RINGKASAN LAPORAN
  // ----------------------------------------------------
  const summaryRows = [
    { 'Parameter Laporan': 'Nama Toko', 'Nilai': 'Tari Jaya' },
    { 'Parameter Laporan': 'Tanggal Ekspor', 'Nilai': formatDateTime(new Date().toISOString()) },
    { 'Parameter Laporan': 'Periode Laporan', 'Nilai': periodLabel },
    { 'Parameter Laporan': 'Rentang Tanggal', 'Nilai': startDate && endDate ? `${formatDate(startDate)} s/d ${formatDate(endDate)}` : '-' },
    { 'Parameter Laporan': '', 'Nilai': '' },
    { 'Parameter Laporan': 'Total Omzet Penjualan (Keluar)', 'Nilai': totalOutValue },
    { 'Parameter Laporan': 'Total Belanja Modal (Masuk)', 'Nilai': totalInValue },
    { 'Parameter Laporan': 'Estimasi Laba Kotor', 'Nilai': totalGrossProfit },
    { 'Parameter Laporan': 'Margin Keuntungan', 'Nilai': marginPercentage },
    { 'Parameter Laporan': 'Net Arus Kas Kasir', 'Nilai': netCashflow },
    { 'Parameter Laporan': 'Total Kuantitas Barang Keluar', 'Nilai': totalOutQty },
    { 'Parameter Laporan': 'Total Kuantitas Barang Masuk', 'Nilai': totalInQty },
    { 'Parameter Laporan': 'Total Frekuensi Transaksi', 'Nilai': mutations.length },
    { 'Parameter Laporan': 'Total Jenis Produk di Katalog', 'Nilai': allProducts.length },
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 30 }];

  // ----------------------------------------------------
  // Sheet 2: DETAIL TRANSAKSI MUTASI
  // ----------------------------------------------------
  const mutationRows = mutations.map((m, index) => {
    const prod = productMap.get(m.product_id);
    const catName = prod ? (categoryMap.get(prod.category_id) || 'Umum') : 'Umum';
    const subtotal = m.type === 'IN' ? m.quantity * m.unit_cost : m.quantity * m.unit_price;

    return {
      'No': index + 1,
      'Waktu Transaksi': formatDateTime(m.timestamp),
      'Tipe Mutasi': m.type === 'IN' ? 'MASUK' : 'KELUAR',
      'Nama Barang': prod?.name || `Produk #${m.product_id}`,
      'Kategori': catName,
      'Jumlah (Qty)': m.quantity,
      'Harga Satuan (Rp)': m.type === 'IN' ? m.unit_cost : m.unit_price,
      'Total Nilai (Rp)': subtotal,
      'Laba Kotor (Rp)': m.type === 'OUT' ? m.gross_profit : 0,
      'Catatan': m.notes || '-',
    };
  });

  const mutationSheet = XLSX.utils.json_to_sheet(mutationRows);
  mutationSheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 30 },
  ];

  // ----------------------------------------------------
  // Sheet 3: KATALOG & SISA STOK TOKO
  // ----------------------------------------------------
  const catalogRows = allProducts.map((p, index) => {
    const catName = categoryMap.get(p.category_id) || 'Umum';
    const unitMargin = p.selling_price - p.cost_price;
    const totalAssetValue = p.current_stock * p.cost_price;

    let stockStatus = 'Aman';
    if (p.current_stock <= 0) stockStatus = 'Habis';
    else if (p.current_stock <= 3) stockStatus = 'Kritis';
    else if (p.current_stock <= 9) stockStatus = 'Menipis';

    return {
      'No': index + 1,
      'Nama Barang': p.name,
      'Kategori': catName,
      'Sisa Stok': p.current_stock,
      'Status Stok': stockStatus,
      'Harga Modal (Rp)': p.cost_price,
      'Harga Jual (Rp)': p.selling_price,
      'Margin per Unit (Rp)': unitMargin,
      'Total Nilai Modal Stok (Rp)': totalAssetValue,
      'Terakhir Diperbarui': formatDateTime(p.updated_at),
    };
  });

  const catalogSheet = XLSX.utils.json_to_sheet(catalogRows);
  catalogSheet['!cols'] = [
    { wch: 6 },
    { wch: 30 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 26 },
    { wch: 22 },
  ];

  // 3. Buat Workbook XLSX
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Laporan');
  XLSX.utils.book_append_sheet(workbook, mutationSheet, 'Riwayat Transaksi');
  XLSX.utils.book_append_sheet(workbook, catalogSheet, 'Katalog & Sisa Stok');

  // 4. Download File XLSX
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `Laporan_Tari_Jaya_${dateStr}.xlsx`;
  XLSX.writeFile(workbook, filename);

  return filename;
}
