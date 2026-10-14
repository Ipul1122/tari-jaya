import { db } from './schema';
import type { Product } from './schema';

export interface StockInParams {
  productId: number;
  quantity: number;
  unitCost?: number;
  notes?: string;
}

export interface StockOutParams {
  productId: number;
  quantity: number;
  unitPrice?: number;
  notes?: string;
  allowNegativeStock?: boolean;
}

/**
 * Transaksi Atomik: Transaksi Barang Masuk Massal / Beberapa Barang Sekaligus (Bulk Stock IN)
 */
export async function recordBulkStockIn(items: StockInParams[]): Promise<number[]> {
  if (items.length === 0) {
    throw new Error('Daftar barang masuk tidak boleh kosong');
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      throw new Error('Jumlah kuantitas setiap barang harus minimal 1 unit');
    }
  }

  return await db.transaction('rw', db.products, db.stock_mutations, async () => {
    const mutationIds: number[] = [];
    const now = new Date().toISOString();

    for (const item of items) {
      const product = await db.products.get(item.productId);
      if (!product) throw new Error(`Barang dengan ID #${item.productId} tidak ditemukan`);

      const effectiveCost = item.unitCost !== undefined ? Math.round(item.unitCost) : product.cost_price;
      const newStock = product.current_stock + Math.round(item.quantity);

      await db.products.update(item.productId, {
        current_stock: newStock,
        cost_price: effectiveCost,
        updated_at: now
      });

      const mId = await db.stock_mutations.add({
        product_id: item.productId,
        type: 'IN',
        quantity: Math.round(item.quantity),
        unit_cost: effectiveCost,
        unit_price: product.selling_price,
        gross_profit: 0,
        notes: item.notes?.trim() || undefined,
        timestamp: now
      });

      mutationIds.push(mId);
    }

    return mutationIds;
  });
}

/**
 * Transaksi Atomik: Barang Masuk Tunggal
 */
export async function recordStockIn(params: StockInParams): Promise<number> {
  const ids = await recordBulkStockIn([params]);
  return ids[0];
}

/**
 * Transaksi Atomik: Transaksi Barang Keluar Massal / Beberapa Barang Sekaligus (Bulk Stock OUT)
 */
export async function recordBulkStockOut(
  items: StockOutParams[],
  allowNegativeStock: boolean = false
): Promise<number[]> {
  if (items.length === 0) {
    throw new Error('Daftar barang keluar tidak boleh kosong');
  }

  for (const item of items) {
    if (item.quantity <= 0) {
      throw new Error('Jumlah kuantitas setiap barang harus minimal 1 unit');
    }
  }

  return await db.transaction('rw', db.products, db.stock_mutations, async () => {
    const mutationIds: number[] = [];
    const now = new Date().toISOString();

    for (const item of items) {
      const product = await db.products.get(item.productId);
      if (!product) throw new Error(`Barang dengan ID #${item.productId} tidak ditemukan`);

      const roundQty = Math.round(item.quantity);
      const isAllowedNegative = allowNegativeStock || !!item.allowNegativeStock;

      if (product.current_stock < roundQty && !isAllowedNegative) {
        throw new Error(
          `Stok "${product.name}" tidak mencukupi! Sisa stok hanya ${product.current_stock} unit.`
        );
      }

      const newStock = product.current_stock - roundQty;
      const activeCost = product.cost_price;
      const activePrice = item.unitPrice !== undefined ? Math.round(item.unitPrice) : product.selling_price;
      const profit = (activePrice - activeCost) * roundQty;

      await db.products.update(item.productId, {
        current_stock: newStock,
        updated_at: now
      });

      const mId = await db.stock_mutations.add({
        product_id: item.productId,
        type: 'OUT',
        quantity: roundQty,
        unit_cost: activeCost,
        unit_price: activePrice,
        gross_profit: profit,
        notes: item.notes?.trim() || undefined,
        timestamp: now
      });

      mutationIds.push(mId);
    }

    return mutationIds;
  });
}

/**
 * Transaksi Atomik: Barang Keluar Tunggal
 */
export async function recordStockOut(params: StockOutParams): Promise<number> {
  const ids = await recordBulkStockOut([params], params.allowNegativeStock);
  return ids[0];
}

/**
 * Transaksi Atomik: Pembatalan Mutasi (Void / Rollback)
 */
export async function voidMutation(mutationId: number): Promise<void> {
  await db.transaction('rw', db.products, db.stock_mutations, async () => {
    const mutation = await db.stock_mutations.get(mutationId);
    if (!mutation) throw new Error('Mutasi tidak ditemukan');

    const product = await db.products.get(mutation.product_id);
    if (product) {
      let rolledBackStock = product.current_stock;
      if (mutation.type === 'IN') {
        rolledBackStock = product.current_stock - mutation.quantity;
      } else if (mutation.type === 'OUT') {
        rolledBackStock = product.current_stock + mutation.quantity;
      }

      await db.products.update(product.id!, {
        current_stock: rolledBackStock,
        updated_at: new Date().toISOString()
      });
    }

    await db.stock_mutations.delete(mutationId);
  });
}

/**
 * Tambah Produk Baru dengan Stok Awal (jika ada)
 */
export async function createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  if (!productData.name.trim()) throw new Error('Nama barang tidak boleh kosong');
  if (productData.cost_price < 0) throw new Error('Harga beli/modal tidak boleh negatif');
  if (productData.selling_price < 0) throw new Error('Harga jual tidak boleh negatif');

  const now = new Date().toISOString();
  const initialStock = Math.round(productData.current_stock || 0);
  const noteText = productData.notes?.trim() || '';

  return await db.transaction('rw', db.products, db.stock_mutations, async () => {
    const id = await db.products.add({
      ...productData,
      name: productData.name.trim(),
      current_stock: initialStock,
      cost_price: Math.round(productData.cost_price),
      selling_price: Math.round(productData.selling_price),
      notes: noteText,
      created_at: now,
      updated_at: now
    });

    if (initialStock > 0) {
      await db.stock_mutations.add({
        product_id: id,
        type: 'IN',
        quantity: initialStock,
        unit_cost: Math.round(productData.cost_price),
        unit_price: Math.round(productData.selling_price),
        gross_profit: 0,
        notes: noteText || 'Stok awal barang baru',
        timestamp: now
      });
    }

    return id;
  });
}

/**
 * Update Produk
 */
export async function updateProduct(
  id: number,
  updates: Partial<Omit<Product, 'id' | 'created_at'>>
): Promise<void> {
  if (updates.name && !updates.name.trim()) throw new Error('Nama barang tidak boleh kosong');
  if (updates.cost_price !== undefined && updates.cost_price < 0) throw new Error('Harga modal tidak boleh negatif');
  if (updates.selling_price !== undefined && updates.selling_price < 0) throw new Error('Harga jual tidak boleh negatif');

  const payload: Partial<Product> = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  if (updates.name) payload.name = updates.name.trim();
  if (updates.cost_price !== undefined) payload.cost_price = Math.round(updates.cost_price);
  if (updates.selling_price !== undefined) payload.selling_price = Math.round(updates.selling_price);
  if (updates.current_stock !== undefined) payload.current_stock = Math.round(updates.current_stock);
  if (updates.notes !== undefined) payload.notes = updates.notes.trim();

  await db.products.update(id, payload);
}

/**
 * Hapus Produk beserta mutasi terkait
 */
export async function deleteProduct(id: number): Promise<void> {
  await db.transaction('rw', db.products, db.stock_mutations, async () => {
    await db.stock_mutations.where('product_id').equals(id).delete();
    await db.products.delete(id);
  });
}

/**
 * CRUD Kategori dengan validasi relasi (PRD F-01)
 */
export async function createCategory(name: string): Promise<number> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nama kategori tidak boleh kosong');
  
  const existing = await db.categories.where('name').equalsIgnoreCase(trimmed).first();
  if (existing) throw new Error('Kategori dengan nama tersebut sudah ada');

  return await db.categories.add({
    name: trimmed,
    created_at: new Date().toISOString()
  });
}

export async function updateCategory(id: number, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nama kategori tidak boleh kosong');

  const existing = await db.categories.where('name').equalsIgnoreCase(trimmed).first();
  if (existing && existing.id !== id) throw new Error('Kategori dengan nama tersebut sudah ada');

  await db.categories.update(id, { name: trimmed });
}

export async function deleteCategory(id: number): Promise<void> {
  const associatedCount = await db.products.where('category_id').equals(id).count();
  if (associatedCount > 0) {
    throw new Error(`Kategori tidak dapat dihapus karena masih digunakan oleh ${associatedCount} barang aktif.`);
  }

  const totalCategories = await db.categories.count();
  if (totalCategories <= 1) {
    throw new Error('Sistem harus memiliki minimal 1 kategori.');
  }

  await db.categories.delete(id);
}

/**
 * Gabungkan beberapa produk yang memiliki nama sama ke 1 master produk
 */
export async function mergeProducts(masterId: number, sourceIds: number[]): Promise<void> {
  await db.transaction('rw', db.products, db.stock_mutations, async () => {
    const master = await db.products.get(masterId);
    if (!master) throw new Error('Master produk tidak ditemukan');

    let additionalStock = 0;
    const combinedNotes: string[] = master.notes ? [master.notes] : [];

    for (const srcId of sourceIds) {
      if (srcId === masterId) continue;
      const src = await db.products.get(srcId);
      if (src) {
        additionalStock += src.current_stock;
        if (src.notes && !combinedNotes.includes(src.notes)) {
          combinedNotes.push(src.notes);
        }
        // Pindahkan mutasi ke masterId
        await db.stock_mutations.where('product_id').equals(srcId).modify({ product_id: masterId });
        // Hapus produk duplikat
        await db.products.delete(srcId);
      }
    }

    // Update master product
    await db.products.update(masterId, {
      current_stock: master.current_stock + additionalStock,
      notes: combinedNotes.join(' | '),
      updated_at: new Date().toISOString(),
    });
  });
}
