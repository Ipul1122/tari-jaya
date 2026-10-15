import { db } from './schema';
import type { Category, Product, StockMutation, AppSetting, DebtRecord } from './schema';

export interface BackupPayload {
  version: number;
  app: string;
  exported_at: string;
  data: {
    categories: Category[];
    products: Product[];
    stock_mutations: StockMutation[];
    settings?: AppSetting[];
    debts?: DebtRecord[];
  };
}

/**
 * Ekspor data lokal ke file JSON yang dapat diunduh
 */
export async function exportDatabaseToJson(): Promise<string> {
  const categories = await db.categories.toArray();
  const products = await db.products.toArray();
  const stock_mutations = await db.stock_mutations.toArray();
  const settings = await db.settings.toArray();
  const debts = await db.debts.toArray();

  const payload: BackupPayload = {
    version: 2,
    app: 'StandaloneStockLedger',
    exported_at: new Date().toISOString(),
    data: {
      categories,
      products,
      stock_mutations,
      settings,
      debts,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  // Buat nama file: backup_tari_jaya_YYYY-MM-DD.json
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `backup_tari_jaya_${dateStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return filename;
}

/**
 * Validasi ketat format berkas cadangan JSON sebelum memulihkan data
 */
export function validateBackupData(parsed: unknown): parsed is BackupPayload {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Format berkas tidak valid: bukan objek JSON.');
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.app !== 'StandaloneStockLedger' && obj.app !== 'TariJaya') {
    throw new Error('Berkas cadangan tidak cocok (App identifier tidak sesuai).');
  }

  if (!obj.data || typeof obj.data !== 'object') {
    throw new Error('Berkas rusak: atribut "data" tidak ditemukan.');
  }

  const data = obj.data as Record<string, unknown>;

  if (!Array.isArray(data.categories)) {
    throw new Error('Format salah: tabel "categories" wajib berupa array.');
  }

  if (!Array.isArray(data.products)) {
    throw new Error('Format salah: tabel "products" wajib berupa array.');
  }

  if (!Array.isArray(data.stock_mutations)) {
    throw new Error('Format salah: tabel "stock_mutations" wajib berupa array.');
  }

  return true;
}

/**
 * Pulihkan data dari berkas JSON ke IndexedDB
 */
export async function restoreDatabaseFromJson(jsonContent: string): Promise<{
  categoriesCount: number;
  productsCount: number;
  mutationsCount: number;
  debtsCount: number;
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonContent);
  } catch {
    throw new Error('Gagal membaca berkas: Berkas bukan format JSON yang valid.');
  }

  if (!validateBackupData(parsed)) {
    throw new Error('Validasi struktur skema cadangan gagal.');
  }

  const backup = parsed as BackupPayload;

  // Eksekusi pemulihan data secara atomik
  await db.transaction('rw', [db.categories, db.products, db.stock_mutations, db.settings, db.debts], async () => {
    // 1. Bersihkan data lama
    await db.categories.clear();
    await db.products.clear();
    await db.stock_mutations.clear();
    await db.settings.clear();
    await db.debts.clear();

    // 2. Masukkan data cadangan
    if (backup.data.categories.length > 0) {
      await db.categories.bulkAdd(backup.data.categories);
    }
    if (backup.data.products.length > 0) {
      await db.products.bulkAdd(backup.data.products);
    }
    if (backup.data.stock_mutations.length > 0) {
      await db.stock_mutations.bulkAdd(backup.data.stock_mutations);
    }
    if (backup.data.settings && backup.data.settings.length > 0) {
      await db.settings.bulkAdd(backup.data.settings);
    }
    if (backup.data.debts && backup.data.debts.length > 0) {
      await db.debts.bulkAdd(backup.data.debts);
    }
  });

  return {
    categoriesCount: backup.data.categories.length,
    productsCount: backup.data.products.length,
    mutationsCount: backup.data.stock_mutations.length,
    debtsCount: backup.data.debts?.length || 0,
  };
}
