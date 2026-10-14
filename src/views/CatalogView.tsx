import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductCard } from '../components/products/ProductCard';
import { ProductModal } from '../components/products/ProductModal';
import { CategoryModal } from '../components/products/CategoryModal';
import type { Product } from '../db/schema';
import { createProduct, updateProduct, deleteProduct } from '../db/operations';
import { useToast } from '../components/common/Toast';
import { Search, Plus, Tag, PackageSearch, X, ArrowUpDown } from 'lucide-react';

export type ProductSortOption = 
  | 'latest' 
  | 'name_asc' 
  | 'name_desc' 
  | 'stock_asc' 
  | 'stock_desc' 
  | 'price_asc' 
  | 'price_desc';

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
  const [sortBy, setSortBy] = useState<ProductSortOption>('latest');

  // 150ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { products, allProducts, categories, refresh } = useProducts(selectedCatId, debouncedQuery);

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

  // Calculate search-filtered products (all categories) to count accurate numbers per category chip
  const searchMatchedProducts = useMemo(() => {
    if (!debouncedQuery.trim()) return allProducts;
    const q = debouncedQuery.trim().toLowerCase();
    return allProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [allProducts, debouncedQuery]);

  // Total count for "Semua" chip
  const totalAllCount = searchMatchedProducts.length;

  // Real-time count per category
  const categoryCountMap = useMemo(() => {
    const map = new Map<number, number>();
    categories.forEach((cat) => {
      if (cat.id) map.set(cat.id, 0);
    });
    searchMatchedProducts.forEach((p) => {
      const current = map.get(p.category_id) || 0;
      map.set(p.category_id, current + 1);
    });
    return map;
  }, [categories, searchMatchedProducts]);

  // Apply sorting to currently displayed products
  const sortedProducts = useMemo(() => {
    const list = [...products];
    switch (sortBy) {
      case 'name_asc':
        return list.sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
      case 'name_desc':
        return list.sort((a, b) => b.name.localeCompare(a.name, 'id', { sensitivity: 'base' }));
      case 'stock_asc':
        // Sedikit ke banyak (stok kritis/terendah di atas)
        return list.sort((a, b) => a.current_stock - b.current_stock);
      case 'stock_desc':
        // Banyak ke sedikit
        return list.sort((a, b) => b.current_stock - a.current_stock);
      case 'price_asc':
        return list.sort((a, b) => a.selling_price - b.selling_price);
      case 'price_desc':
        return list.sort((a, b) => b.selling_price - a.selling_price);
      case 'latest':
      default:
        return list.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
  }, [products, sortBy]);

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

      // Jika kategori diubah dari kategori yang sedang difilter aktif:
      // Otomatis pindahkan filter aktif ke kategori baru agar produk tetap terlihat!
      if (selectedCatId !== null && selectedCatId !== data.category_id) {
        setSelectedCatId(data.category_id);
        const targetCatName = categoryMap.get(data.category_id) || 'kategori baru';
        showToast(`Barang "${data.name}" dipindahkan ke kategori "${targetCatName}"`, 'success');
      } else {
        showToast(`Barang "${data.name}" berhasil diperbarui`, 'success');
      }
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
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-slate-900 placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500 transition font-medium"
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

        {/* Category Filter Chips Horizontal Scroller with Counts */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            onClick={() => setSelectedCatId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[32px] flex items-center space-x-1.5 ${
              selectedCatId === null
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:text-slate-900 border border-stone-200'
            }`}
          >
            <span>Semua</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              selectedCatId === null ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-700'
            }`}>
              {totalAllCount}
            </span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCatId === cat.id;
            const count = categoryCountMap.get(cat.id!) || 0;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id!)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[32px] flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-stone-100 text-stone-700 hover:text-slate-900 border border-stone-200'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sub-bar: Total Counter & Sort Options */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
          <span className="text-[11px] font-medium text-stone-500">
            Menampilkan <b className="text-slate-900 font-bold font-mono">{sortedProducts.length}</b> barang
          </span>

          {/* Sort Selector */}
          <div className="flex items-center space-x-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ProductSortOption)}
              className="py-1 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-slate-800 text-[11px] font-bold focus:outline-none focus:border-orange-500 cursor-pointer transition shadow-2xs"
            >
              <option value="latest">Terbaru</option>
              <option value="name_asc">Nama (A - Z)</option>
              <option value="name_desc">Nama (Z - A)</option>
              <option value="stock_asc">Stok (Sedikit - Banyak)</option>
              <option value="stock_desc">Stok (Banyak - Sedikit)</option>
              <option value="price_asc">Harga Terendah</option>
              <option value="price_desc">Harga Tertinggi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Catalog List */}
      <div className="px-4 mt-3 space-y-3">
        {sortedProducts.length === 0 ? (
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
              <span className="font-bold">Tambah Barang Baru</span>
            </button>
          </div>
        ) : (
          sortedProducts.map((prod) => (
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
