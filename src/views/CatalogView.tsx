import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/products/ProductCard';
import { ProductModal } from '../components/products/ProductModal';
import { CategoryModal } from '../components/products/CategoryModal';
import type { Product } from '../db/schema';
import { createProduct, updateProduct, deleteProduct } from '../db/operations';
import { useToast } from '../components/common/Toast';
import { Search, Plus, Tag, PackageSearch, X } from 'lucide-react';

interface CatalogViewProps {
  onOpenStockIn: (product: Product) => void;
  onOpenStockOut: (product: Product) => void;
  onProductsChanged?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  onOpenStockIn,
  onOpenStockOut,
  onProductsChanged,
}) => {
  const { showToast } = useToast();
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');

  // 150ms debounce as specified in PRD F-02
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { products, categories, refresh } = useProducts(selectedCatId, debouncedQuery);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Map category id to name
  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => {
      if (c.id) map.set(c.id, c.name);
    });
    return map;
  }, [categories]);

  const handleCreateOrUpdateProduct = async (data: {
    id?: number;
    name: string;
    category_id: number;
    current_stock: number;
    cost_price: number;
    selling_price: number;
  }) => {
    if (data.id) {
      await updateProduct(data.id, {
        name: data.name,
        category_id: data.category_id,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        current_stock: data.current_stock,
      });
      showToast(`Barang "${data.name}" berhasil diperbarui`, 'success');
    } else {
      await createProduct({
        name: data.name,
        category_id: data.category_id,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        current_stock: data.current_stock,
      });
      showToast(`Barang "${data.name}" berhasil ditambahkan ke katalog`, 'success');
    }
    refresh();
    onProductsChanged?.();
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      await deleteProduct(product.id!);
      showToast(`Barang "${product.name}" berhasil dihapus`, 'info');
      refresh();
      onProductsChanged?.();
    } catch (err: any) {
      showToast(err?.message || 'Gagal menghapus barang', 'error');
    }
  };

  const handleFilterByCategoryFromModal = (catId: number, catName: string) => {
    setSelectedCatId(catId);
    showToast(`Menampilkan barang di kategori "${catName}"`, 'info');
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Top Search & Actions Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 pt-3 pb-2 border-b border-stone-200 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari barang di katalog..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-slate-900 placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500 transition"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-slate-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Manager Button */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-700 hover:text-slate-900 hover:bg-stone-200 active:scale-95 transition min-w-[42px] min-h-[42px] flex items-center justify-center shrink-0"
            title="Kelola Kategori"
          >
            <Tag className="w-4 h-4 text-stone-600" />
          </button>

          {/* Add Product Button: Text Button Add GREEN */}
          <button
            onClick={() => {
              setProductToEdit(null);
              setIsProductModalOpen(true);
            }}
            className="flex items-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition shrink-0 min-h-[42px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="font-bold">Tambah</span>
          </button>
        </div>

        {/* Category Filter Chips Horizontal Scroller */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCatId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[32px] ${
              selectedCatId === null
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:text-slate-900 border border-stone-200'
            }`}
          >
            Semua ({products.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id!)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[32px] ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:text-slate-900 border border-stone-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Catalog List */}
      <div className="px-4 mt-3 space-y-3">
        {products.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center my-6 shadow-xs">
            <PackageSearch className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Tidak ada barang ditemukan</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              {debouncedQuery
                ? `Tidak ada hasil pencarian untuk "${debouncedQuery}". Coba kata kunci lain.`
                : 'Belum ada produk pada kategori ini. Silakan tambahkan barang baru.'}
            </p>
            {/* Text Button Add GREEN */}
            <button
              onClick={() => {
                setProductToEdit(null);
                setIsProductModalOpen(true);
              }}
              className="mt-4 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="font-bold">+ Tambah Barang Baru</span>
            </button>
          </div>
        ) : (
          products.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              categoryName={categoryMap.get(prod.category_id) || 'Umum'}
              onStockIn={onOpenStockIn}
              onStockOut={onOpenStockOut}
              onEdit={(p) => {
                setProductToEdit(p);
                setIsProductModalOpen(true);
              }}
              onDelete={handleDeleteProduct}
            />
          ))
        )}
      </div>

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleCreateOrUpdateProduct}
        productToEdit={productToEdit}
        categories={categories}
        onOpenCategoryManager={() => {
          setIsProductModalOpen(false);
          setIsCategoryModalOpen(true);
        }}
      />

      {/* Category Manager Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onRefreshCategories={refresh}
        onFilterByCategory={handleFilterByCategoryFromModal}
      />
    </div>
  );
};
