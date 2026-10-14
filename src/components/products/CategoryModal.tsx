import React, { useState, useEffect } from 'react';
import { db } from '../../db/schema';
import type { Category } from '../../db/schema';
import { createCategory, updateCategory, deleteCategory } from '../../db/operations';
import { X, Tag, Plus, Edit2, Trash2, Check, AlertCircle, AlertTriangle, PackageSearch } from 'lucide-react';
import { useToast } from '../common/Toast';
import { PopoverConfirm } from '../common/PopoverConfirm';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onRefreshCategories: () => void;
  onFilterByCategory?: (categoryId: number, categoryName: string) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onRefreshCategories,
  onFilterByCategory,
}) => {
  const { showToast } = useToast();
  const [newCatName, setNewCatName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [productCounts, setProductCounts] = useState<Record<number, number>>({});
  const [blockedCategory, setBlockedCategory] = useState<{ id: number; name: string; count: number } | null>(null);

  // Ambil jumlah barang per kategori setiap kali modal dibuka atau kategori diperbarui
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setBlockedCategory(null);

    const loadCounts = async () => {
      const allProducts = await db.products.toArray();
      const counts: Record<number, number> = {};
      for (const p of allProducts) {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      }
      setProductCounts(counts);
    };

    loadCounts();
  }, [isOpen, categories]);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setError(null);
      setBlockedCategory(null);
      await createCategory(newCatName.trim());
      setNewCatName('');
      showToast('Kategori baru berhasil ditambahkan');
      onRefreshCategories();
    } catch (err: any) {
      setError(err?.message || 'Gagal menambahkan kategori');
    }
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id!);
    setEditName(cat.name);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editName.trim()) return;

    try {
      setError(null);
      await updateCategory(id, editName.trim());
      setEditingId(null);
      showToast('Nama kategori berhasil diperbarui');
      onRefreshCategories();
    } catch (err: any) {
      setError(err?.message || 'Gagal memperbarui kategori');
    }
  };

  const handleExecuteDelete = async (cat: Category) => {
    setConfirmDeleteCatId(null);
    const count = productCounts[cat.id!] || 0;

    if (count > 0) {
      setBlockedCategory({ id: cat.id!, name: cat.name, count });
      return;
    }

    try {
      setError(null);
      setBlockedCategory(null);
      await deleteCategory(cat.id!);
      showToast(`Kategori "${cat.name}" berhasil dihapus`);
      onRefreshCategories();
    } catch (err: any) {
      const errStr = err?.message || 'Gagal menghapus kategori';
      setError(errStr);
      if (count > 0 || errStr.includes('digunakan')) {
        setBlockedCategory({ id: cat.id!, name: cat.name, count: count || 1 });
      }
    }
  };

  const handleNavigateToCategoryProducts = (catId: number, catName: string) => {
    onClose();
    if (onFilterByCategory) {
      onFilterByCategory(catId, catName);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#FAF8F5] border border-stone-200 rounded-t-3xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl animate-slide-up text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-white sm:rounded-t-2xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Kelola Kategori</h2>
              <p className="text-xs text-stone-500">Pengelompokan barang inventaris toko</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-slate-900 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Direct Banner when category deletion is blocked because it has active products */}
          {blockedCategory && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2.5 animate-fade-in shadow-xs">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <b className="font-bold text-amber-950 block">Kategori Belum Dapat Dihapus</b>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Kategori <b>"{blockedCategory.name}"</b> masih digunakan oleh <b>{blockedCategory.count} barang aktif</b> di toko.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNavigateToCategoryProducts(blockedCategory.id, blockedCategory.name)}
                className="w-full py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-600/20 active:scale-95 transition"
              >
                <PackageSearch className="w-4 h-4" />
                <span>Lihat {blockedCategory.count} Barang Ini di Katalog &rarr;</span>
              </button>
            </div>
          )}

          {error && !blockedCategory && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-2 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Add Category Input */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Nama kategori baru..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-slate-900 placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500"
            />
            {/* Text Button Add GREEN */}
            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm active:scale-95 transition min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span className="font-bold">Tambah</span>
            </button>
          </form>

          {/* Category List */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
              Daftar Kategori Aktif ({categories.length})
            </span>

            {categories.map((cat) => {
              const isEditing = editingId === cat.id;
              const isConfirmingDelete = confirmDeleteCatId === cat.id;
              const prodCount = productCounts[cat.id!] || 0;

              return (
                <div
                  key={cat.id}
                  className="relative flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200 shadow-xs"
                >
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-stone-50 border border-orange-500 text-slate-900 text-xs focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveEdit(cat.id!)}
                        className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg bg-stone-200 text-stone-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center space-x-2">
                        <Tag className="w-3.5 h-3.5 text-stone-400" />
                        <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                        {/* Count Badge - Klik badge untuk langsung melihat produk */}
                        <button
                          type="button"
                          onClick={() => prodCount > 0 && handleNavigateToCategoryProducts(cat.id!, cat.name)}
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border transition ${
                            prodCount > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300 cursor-pointer'
                              : 'bg-stone-100 text-stone-500 border-stone-200'
                          }`}
                          title={prodCount > 0 ? `Klik untuk melihat ${prodCount} barang ini di katalog` : 'Belum ada barang'}
                        >
                          {prodCount} barang
                        </button>
                      </div>
                      <div className="flex items-center space-x-1 relative">
                        <button
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 rounded-lg text-stone-500 hover:text-slate-900 hover:bg-stone-100 transition"
                          title="Ubah nama"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Text Button Delete RED -> Triggers Popover */}
                        <button
                          onClick={() => setConfirmDeleteCatId(isConfirmingDelete ? null : cat.id!)}
                          className="p-1.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition"
                          title="Hapus kategori"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>

                        {/* Popover confirmation for category delete */}
                        {prodCount > 0 ? (
                          <PopoverConfirm
                            isOpen={isConfirmingDelete}
                            title={`Kategori "${cat.name}" Memiliki ${prodCount} Barang`}
                            description={`Tidak dapat dihapus karena masih digunakan oleh ${prodCount} barang aktif. Ingin langsung melihat daftar barang tersebut?`}
                            confirmLabel={`Lihat ${prodCount} Barang`}
                            cancelLabel="Batal"
                            variant="warning"
                            position="top-right"
                            onConfirm={() => {
                              setConfirmDeleteCatId(null);
                              handleNavigateToCategoryProducts(cat.id!, cat.name);
                            }}
                            onCancel={() => setConfirmDeleteCatId(null)}
                          />
                        ) : (
                          <PopoverConfirm
                            isOpen={isConfirmingDelete}
                            title={`Hapus kategori "${cat.name}"?`}
                            description="Kategori ini tidak memiliki barang aktif dan akan dihapus secara permanen."
                            confirmLabel="Ya, Hapus"
                            cancelLabel="Batal"
                            variant="danger"
                            position="top-right"
                            onConfirm={() => handleExecuteDelete(cat)}
                            onCancel={() => setConfirmDeleteCatId(null)}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
