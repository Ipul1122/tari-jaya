import { db } from './schema';

/**
 * CRUD Kategori (Disederhanakan untuk kompatibilitas data lama)
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
