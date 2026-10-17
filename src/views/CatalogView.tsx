import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useProductContainers, type ProductSortOption } from '../hooks/useProductContainers';
import { ProductContainerCard, type ProductContainerGroup } from '../components/products/ProductContainerCard';
import { ProductModal } from '../components/products/ProductModal';
import { ProductDetailModal } from '../components/products/ProductDetailModal';
import { CatalogSearchBar } from '../components/products/CatalogSearchBar';
import { Pagination } from '../components/common/Pagination';
import type { Product } from '../db/schema';
import { createProduct, updateProduct, deleteProduct, mergeProducts } from '../db/operations';
import { useToast } from '../components/common/Toast';
import { PackageSearch, Plus } from 'lucide-react';

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
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<ProductSortOption>('latest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { products, allProducts, refresh } = useProducts(null, debouncedQuery);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, sortBy]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);

  const productContainers = useProductContainers(products, sortBy);

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
    category_id?: number;
    current_stock: number;
    cost_price: number;
    selling_price: number;
    notes?: string;
  }) => {
    if (data.id) {
      await updateProduct(data.id, {
        name: data.name,
        cost_price: data.cost_price,
        selling_price: data.selling_price,
        current_stock: data.current_stock,
        notes: data.notes,
      });
      showToast(`Barang "${data.name}" berhasil diperbarui`, 'success');
    } else {
      await createProduct({
        name: data.name,
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus barang';
      showToast(msg, 'error');
    }
  };

  const handleMergeContainer = async (container: ProductContainerGroup) => {
    try {
      if (container.items.length <= 1) return;
      const master = container.items[0];
      const sourceIds = container.items.map((i) => i.id!).filter(Boolean);
      await mergeProducts(master.id!, sourceIds);
      showToast(
        `Semua wadah "${container.name}" berhasil disatukan (${container.total_stock} unit)`,
        'success'
      );
      refresh();
      onProductsChanged?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menggabungkan wadah';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Search Bar & Sort Selector */}
      <CatalogSearchBar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onClearSearch={() => setSearchInput('')}
        onOpenAddModal={() => {
          setProductToEdit(null);
          setIsProductModalOpen(true);
        }}
        totalContainers={totalContainers}
        startIndex={startIndex}
        endIndex={endIndex}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Product List */}
      <div className="p-4 space-y-3">
        {paginatedContainers.length === 0 ? (
          <div className="p-10 rounded-3xl bg-white border border-stone-200 text-center shadow-xs">
            <PackageSearch className="w-12 h-12 text-stone-300 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-800">Material tidak ditemukan</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-[260px] mx-auto">
              {searchInput
                ? `Tidak ada material yang cocok dengan "${searchInput}".`
                : 'Belum ada material di katalog toko Anda.'}
            </p>
            <button
              onClick={() => {
                setSearchInput('');
                setIsProductModalOpen(true);
              }}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-sm hover:bg-orange-700 active:scale-95 transition min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Material Sekarang</span>
            </button>
          </div>
        ) : (
          paginatedContainers.map((container) => (
            <ProductContainerCard
              key={container.key}
              container={container}
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
      </div>

      {/* Pagination Footer */}
      {totalContainers > 0 && (
        <div className="px-4 pb-4">
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            totalItems={totalContainers}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName="material"
            itemsPerPageOptions={[5, 10, 20]}
          />
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={handleCreateOrUpdateProduct}
        productToEdit={productToEdit}
        existingProducts={allProducts}
        onOpenStockInForExisting={onOpenStockIn}
      />

      <ProductDetailModal
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        product={selectedProductForDetail}
        onStockIn={onOpenStockIn}
        onStockOut={onOpenStockOut}
        onEdit={(p) => {
          setProductToEdit(p);
          setIsProductModalOpen(true);
        }}
      />
    </div>
  );
};
