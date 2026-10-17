import * as XLSX from 'xlsx';
import { db } from '../db/schema';

export interface RestoreExcelResult {
  productsCount: number;
  debtsCount: number;
  mutationsCount: number;
}

export async function restoreDatabaseFromExcel(file: File): Promise<RestoreExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const now = new Date().toISOString();

  let productsCount = 0;
  let debtsCount = 0;
  let mutationsCount = 0;

  // 1. Pulihkan Sheet: Katalog & Sisa Stok
  const catalogSheet = workbook.Sheets['Katalog & Sisa Stok'];
  const productMapByName = new Map<string, number>();

  if (catalogSheet) {
    const rawProducts: Record<string, unknown>[] = XLSX.utils.sheet_to_json(catalogSheet);
    const existingProducts = await db.products.toArray();
    const existingMap = new Map(existingProducts.map((p) => [p.name.trim().toLowerCase(), p]));

    for (const row of rawProducts) {
      const name = String(row['Nama Barang'] || '').trim();
      if (!name) continue;

      const costPrice = Math.round(Number(row['Harga Modal (Rp)']) || 0);
      const sellingPrice = Math.round(Number(row['Harga Jual (Rp)']) || 0);
      const stock = Math.round(Number(row['Sisa Stok']) || 0);
      const notes = row['Catatan / Vendor'] ? String(row['Catatan / Vendor']).trim() : undefined;

      const existing = existingMap.get(name.toLowerCase());
      if (existing && existing.id) {
        await db.products.update(existing.id, {
          cost_price: costPrice,
          selling_price: sellingPrice,
          current_stock: stock,
          notes: notes || existing.notes,
          updated_at: now,
        });
        productMapByName.set(name.toLowerCase(), existing.id);
      } else {
        const newId = await db.products.add({
          name,
          cost_price: costPrice,
          selling_price: sellingPrice,
          current_stock: stock,
          notes,
          created_at: now,
          updated_at: now,
        });
        productMapByName.set(name.toLowerCase(), newId);
      }
      productsCount++;
    }
  }

  // Reload products map to ensure IDs exist for mutations
  const allCurrentProducts = await db.products.toArray();
  allCurrentProducts.forEach((p) => {
    if (p.id) productMapByName.set(p.name.trim().toLowerCase(), p.id);
  });

  // 2. Pulihkan Sheet: Buku Piutang Kasbon
  const debtSheet = workbook.Sheets['Buku Piutang Kasbon'];
  if (debtSheet) {
    const rawDebts: Record<string, unknown>[] = XLSX.utils.sheet_to_json(debtSheet);
    for (const row of rawDebts) {
      const personName = String(row['Nama Pelanggan'] || '').trim();
      if (!personName) continue;

      const totalAmount = Math.round(Number(row['Total Tagihan (Rp)']) || 0);
      const paidAmount = Math.round(Number(row['Sudah Dibayar (Rp)']) || 0);
      const rawStatus = String(row['Status'] || '').toUpperCase();
      const status = rawStatus === 'LUNAS' || paidAmount >= totalAmount ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';
      const phone = row['No. Telepon / WA'] && String(row['No. Telepon / WA']) !== '-' ? String(row['No. Telepon / WA']).trim() : undefined;
      const notes = row['Catatan Rincian'] && String(row['Catatan Rincian']) !== '-' ? String(row['Catatan Rincian']).trim() : undefined;

      await db.debts.add({
        type: 'PIUTANG',
        person_name: personName,
        phone,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        status,
        notes,
        created_at: now,
        updated_at: now,
      });
      debtsCount++;
    }
  }

  // 3. Pulihkan Sheet: Riwayat Transaksi
  const mutationSheet = workbook.Sheets['Riwayat Transaksi'];
  if (mutationSheet) {
    const rawMutations: Record<string, unknown>[] = XLSX.utils.sheet_to_json(mutationSheet);
    for (const row of rawMutations) {
      const prodName = String(row['Nama Barang'] || '').trim();
      const prodId = productMapByName.get(prodName.toLowerCase());
      if (!prodId) continue;

      const typeStr = String(row['Tipe Mutasi'] || '').toUpperCase();
      const type: 'IN' | 'OUT' = typeStr.includes('MASUK') || typeStr === 'IN' ? 'IN' : 'OUT';
      const quantity = Math.round(Number(row['Jumlah (Qty)']) || 1);
      const unitPrice = Math.round(Number(row['Harga Satuan (Rp)']) || 0);
      const grossProfit = Math.round(Number(row['Laba Kotor (Rp)']) || 0);
      const notes = row['Catatan'] && String(row['Catatan']) !== '-' ? String(row['Catatan']).trim() : undefined;

      await db.stock_mutations.add({
        product_id: prodId,
        type,
        quantity,
        unit_cost: type === 'IN' ? unitPrice : 0,
        unit_price: type === 'OUT' ? unitPrice : 0,
        gross_profit: grossProfit,
        notes,
        timestamp: now,
      });
      mutationsCount++;
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tari-mutations-updated'));
    window.dispatchEvent(new CustomEvent('tari-debts-updated'));
  }

  return { productsCount, debtsCount, mutationsCount };
}
