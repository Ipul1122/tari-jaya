import Dexie, { type Table } from 'dexie';

export interface Category {
  id?: number;
  name: string;
  created_at: string;
}

export interface Product {
  id?: number;
  category_id: number;
  name: string;
  current_stock: number;
  cost_price: number;     // Harga modal/beli per unit (Integer IDR)
  selling_price: number;  // Harga jual per unit (Integer IDR)
  notes?: string;         // Catatan/keterangan barang (opsional)
  created_at: string;
  updated_at: string;
}

export interface StockMutation {
  id?: number;
  product_id: number;
  type: 'IN' | 'OUT';
  quantity: number;
  unit_cost: number;      // Harga modal saat transaksi terjadi (Integer IDR)
  unit_price: number;     // Harga jual saat transaksi terjadi (Integer IDR)
  gross_profit: number;   // Jika type === 'OUT': (unit_price - unit_cost) * quantity
  notes?: string;
  timestamp: string;      // ISO String YYYY-MM-DDTHH:mm:ss.sssZ
}

export interface AppSetting {
  key: string;
  value: string | number | boolean;
}

export class InventoryDatabase extends Dexie {
  categories!: Table<Category, number>;
  products!: Table<Product, number>;
  stock_mutations!: Table<StockMutation, number>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('OfflineStoreInventoryDB');
    this.version(1).stores({
      categories: '++id, name',
      products: '++id, category_id, name, current_stock',
      stock_mutations: '++id, product_id, type, timestamp, [type+timestamp]',
      settings: 'key'
    });
  }
}

export const db = new InventoryDatabase();

/**
 * Inisialisasi awal database lokal:
 * Hanya memastikan minimal 1 kategori default ("Umum") tersedia sesuai PRD F-01.
 * Tanpa data dummy/barang demo.
 */
export async function seedInitialDataIfNeeded() {
  // 1. Bersihkan sisa data dummy jika sebelumnya sempat tersimpan di browser
  const dummyCleaned = await db.settings.get('dummy_cleaned_v2');
  if (!dummyCleaned) {
    const dummyNames = [
      'Minyak Goreng 1L',
      'Beras Super 5kg',
      'Kopi Kapal Api Special Mix',
      'Teh Botol Sosro 350ml',
      'Telur Ayam 1kg'
    ];

    const allProducts = await db.products.toArray();
    const dummyProdIds = allProducts
      .filter((p) => dummyNames.includes(p.name))
      .map((p) => p.id!);

    if (dummyProdIds.length > 0) {
      await db.transaction('rw', [db.products, db.stock_mutations], async () => {
        for (const id of dummyProdIds) {
          await db.stock_mutations.where('product_id').equals(id).delete();
          await db.products.delete(id);
        }
      });
    }

    // Bersihkan mutasi demo jika ada
    await db.stock_mutations.where('notes').equals('Stok awal kulakan').delete();
    await db.stock_mutations.where('notes').equals('Penjualan ke Ibu Ani').delete();
    await db.stock_mutations.where('notes').equals('Kulakan grosir').delete();
    await db.stock_mutations.where('notes').equals('Laku di warung').delete();

    // Hapus kategori dummy jika tidak memiliki produk
    const sembako = await db.categories.where('name').equals('Sembako').first();
    if (sembako?.id) {
      const sembakoCount = await db.products.where('category_id').equals(sembako.id).count();
      if (sembakoCount === 0) await db.categories.delete(sembako.id);
    }

    const minuman = await db.categories.where('name').equals('Minuman & Snack').first();
    if (minuman?.id) {
      const minumanCount = await db.products.where('category_id').equals(minuman.id).count();
      if (minumanCount === 0) await db.categories.delete(minuman.id);
    }

    await db.settings.put({ key: 'dummy_cleaned_v2', value: true });
  }

  // 2. Pastikan minimal 1 kategori default ada (PRD F-01)
  const categoryCount = await db.categories.count();
  if (categoryCount === 0) {
    await db.categories.add({
      name: 'Umum',
      created_at: new Date().toISOString()
    });
  }
}

/**
 * Bersihkan seluruh data (Reset penuh ke kondisi awal bersih)
 */
export async function clearAllDatabaseData(): Promise<void> {
  await db.transaction('rw', [db.categories, db.products, db.stock_mutations], async () => {
    await db.products.clear();
    await db.stock_mutations.clear();
    await db.categories.clear();
    // Buat kembali 1 kategori default "Umum"
    await db.categories.add({
      name: 'Umum',
      created_at: new Date().toISOString()
    });
  });
}
