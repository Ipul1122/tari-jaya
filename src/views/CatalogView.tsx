import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { ProductContainerCard, type ProductContainerGroup } from '../components/products/ProductContainerCard';
import { ProductModal } from '../components/products/ProductModal';
import { ProductDetailModal } from '../components/products/ProductDetailModal';
import { CategoryModal } from '../components/products/CategoryModal';
import { Pagination } from '../components/common/Pagination';
import type { Product } from '../db/schema';
import { createProduct, updateProduct, deleteProduct, mergeProducts } from '../db/operations';
import { useToast } from '../components/common/Toast';
import { Search, Plus, Tag, PackageSearch, X, ArrowUpDown } from 'lucide-react';
import { formatNumber } from '../utils/formatters';

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // 150ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { products, allProducts, categories, refresh } = useProducts(selectedCatId, debouncedQuery);

  // Reset page to 1 whenever filters or sorting changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCatId, debouncedQuery, sortBy]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

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

  // Group products with the same normalized name into containers
  const productContainers = useMemo(() => {
    const groupsMap = new Map<string, ProductContainerGroup>();

    for (const prod of products) {
      const normalizedKey = prod.name.trim().toLowerCase();
      const existing = groupsMap.get(normalizedKey);

      if (existing) {
        existing.items.push(prod);
        existing.total_stock += prod.current_stock;
        if (new Date(prod.updated_at).getTime() > new Date(existing.latest_updated_at).getTime()) {
          existing.latest_updated_at = prod.updated_at;
        }
      } else {
        groupsMap.set(normalizedKey, {
          key: normalizedKey,
          name: prod.name.trim(),
          category_id: prod.category_id,
          total_stock: prod.current_stock,
          items: [prod],
          latest_updated_at: prod.updated_at,
        });
      }
    }

    const containerList = Array.from(groupsMap.values());

    // Apply sorting to container groups
    switch (sortBy) {
      case 'name_asc':
        return containerList.sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
      case 'name_desc':
        return containerList.sort((a, b) => b.name.localeCompare(a.name, 'id', { sensitivity: 'base' }));
      case 'stock_asc':
        // Sedikit ke banyak (stok kritis/terendah di atas)
        return containerList.sort((a, b) => a.total_stock - b.total_stock);
      case 'stock_desc':
        // Banyak ke sedikit
        return containerList.sort((a, b) => b.total_stock - a.total_stock);
      case 'price_asc':
        return containerList.sort((a, b) => {
          const minA = Math.min(...a.items.map((i) => i.selling_price));
          const minB = Math.min(...b.items.map((i) => i.selling_price));
          return minA - minB;
        });
      case 'price_desc':
        return containerList.sort((a, b) => {
          const maxA = Math.max(...a.items.map((i) => i.selling_price));
          const maxB = Math.max(...b.items.map((i) => i.selling_price));
          return maxB - maxA;
        });
      case 'latest':
      default:
        return containerList.sort(
          (a, b) => new Date(b.latest_updated_at).getTime() - new Date(a.latest_updated_at).getTime()
        );
    }
  }, [products, sortBy]);

  // Pagination calculation based on container groups
  const totalContainers = productContainers.length;
  const totalPages = Math.max(1, Math.ceil(totalContainers / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalContainers);

  const paginatedContainers = useMemo(() => {
    return productContainers.slice(startIndex, endIndex);
  }, [productContainers, startIndex, endIndex]);

  const handleCreateOrUpdateProduct = async (data: {
    id?: number;
    name: string;
    category_id: number;
    current_stock: number;
    cost_price: number;
    selling_price: number;
    notes?: string;
  }) => {
    if (data.id) {
      await updateProduct(data.id, {
        name: data.name,
        category_id: data.category_id,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        current_stock: data.current_stock,
        notes: data.notes,
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
        notes: data.notes,
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

  const handleMergeContainer = async (container: ProductContainerGroup) => {
    try {
      if (container.items.length <= 1) return;
      const master = container.items[0];
      const sourceIds = container.items.map((i) => i.id!).filter(Boolean);
      await mergeProducts(master.id!, sourceIds);
      showToast(
        `Semua wadah "${container.name}" berhasil disatukan menjadi 1 produk (${container.total_stock} unit)`,
        'success'
      );
      refresh();
      onProductsChanged?.();
    } catch (err: any) {
      showToast(err?.message || 'Gagal menggabungkan wadah produk', 'error');
    }
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

        {/* Sub-bar: Showing Counter, Pagination status & Sort Options */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
          <span className="text-[11px] font-medium text-stone-500">
            {totalContainers > 0 ? (
              <>
                <b className="text-slate-900 font-bold font-mono">
                  {formatNumber(startIndex + 1)}-{formatNumber(endIndex)}
                </b>{' '}
                dari <b className="text-slate-900 font-bold font-mono">{formatNumber(totalContainers)}</b> barang
              </>
            ) : (
              '0 barang'
            )}
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
        {paginatedContainers.length === 0 ? (
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
          paginatedContainers.map((container) => (
            <ProductContainerCard
              key={container.key}
              container={container}
              categoryName={categoryMap.get(container.category_id) || 'Umum'}
              onStockIn={onOpenStockIn}
              onStockOut={onOpenStockOut}
              onEdit={(p) => {
                setProductToEdit(p);
                setIsProductModalOpen(true);
              }}
              onDelete={handleDeleteProduct}
              onViewDetail={(p) => setSelectedProductForDetail(p)}
              onMerge={handleMergeContainer}
            />
          ))
        )}

        {/* Pagination Navigation */}
        {totalContainers > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={totalContainers}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName="barang"
            itemsPerPageOptions={[10, 20, 50]}
          />
        )}
      </div>

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleCreateOrUpdateProduct}
        productToEdit={productToEdit}
        categories={categories}
        existingProducts={allProducts}
        onOpenStockInForExisting={(p) => onOpenStockIn(p)}
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

      {/* Product Container Detail & Batch History Modal */}
      <ProductDetailModal
        isOpen={selectedProductForDetail !== null}
        onClose={() => setSelectedProductForDetail(null)}
        product={selectedProductForDetail}
        categoryName={
          selectedProductForDetail
            ? categoryMap.get(selectedProductForDetail.category_id) || 'Umum'
            : 'Umum'
        }
        onStockIn={onOpenStockIn}
        onStockOut={onOpenStockOut}
        onEdit={(p) => {
          setSelectedProductForDetail(null);
          setProductToEdit(p);
          setIsProductModalOpen(true);
        }}
      />
    </div>
  );
};
