import React, { useState, useEffect, useMemo } from 'react';
import type { Product } from '../../db/schema';
import { recordBulkStockIn } from '../../db/operations';
import { DrawerSelectTab } from './DrawerSelectTab';
import { DrawerReviewTab } from './DrawerReviewTab';
import { DrawerBottomBar } from './DrawerBottomBar';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';
import { useDrawerCart } from './useDrawerCart';
import { 
  X, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertCircle, 
  Search, 
  ListPlus 
} from 'lucide-react';
import { useToast } from '../common/Toast';

export interface BulkItemEntry {
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface QuickInOutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'IN' | 'OUT';
  selectedProduct?: Product | null;
  products: Product[];
  onSuccess: () => void;
  onNavigateToHistory?: () => void;
}

export const QuickInOutDrawer: React.FC<QuickInOutDrawerProps> = ({
  isOpen,
  onClose,
  type,
  selectedProduct,
  products,
  onSuccess,
  onNavigateToHistory,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'select' | 'review'>('select');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allowNegative, setAllowNegative] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isStockIn = type === 'IN';

  const {
    items,
    setItems,
    cartItemMap,
    totalUnits,
    totalValue,
    handleAddProduct,
    handleDecrementProduct,
    handleDirectQuantityChange,
    handleInputBlur,
    updateItemQty,
    updateItemPrice,
    updateItemNotes,
    handleRemoveItem,
  } = useDrawerCart(isStockIn, allowNegative);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setAllowNegative(false);
    setSearchQuery('');

    if (selectedProduct) {
      const freshSelected = products.find((p) => p.id === selectedProduct.id) || selectedProduct;
      setItems([
        {
          productId: freshSelected.id!,
          product: freshSelected,
          quantity: 1,
          unitPrice: isStockIn ? freshSelected.cost_price : freshSelected.selling_price,
          notes: '',
        },
      ]);
      setActiveTab('review');
    } else {
      setItems([]);
      setActiveTab('select');
    }
  }, [isOpen, type, selectedProduct, isStockIn, products, setItems]);

  const duplicateNameCountMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const key = p.name.trim().toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validItems = items.filter((i) => i.quantity > 0);
    if (validItems.length === 0) {
      setError('Pilih minimal 1 barang untuk dicatat');
      return;
    }

    if (!isStockIn && !allowNegative) {
      for (const item of validItems) {
        if (item.quantity > item.product.current_stock) {
          setError(`Stok "${item.product.name}" tidak mencukupi (sisa ${item.product.current_stock} unit)`);
          return;
        }
      }
    }

    if (!isStockIn) {
      // Penjualan: Buka modal pembayaran untuk memilih/membuat nama pelanggan
      setIsPaymentModalOpen(true);
      return;
    }

    // Barang Masuk: Langsung simpan tanpa catatan
    setIsSubmitting(true);
    try {
      await recordBulkStockIn(
        validItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitPrice,
        }))
      );
      showToast(`Berhasil mencatat stok masuk untuk ${validItems.length} jenis barang`, 'success');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mencatat transaksi';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (customerName: string, isKasbon: boolean) => {
    setIsPaymentModalOpen(false);
    onSuccess();
    onClose();
    if (isKasbon) {
      showToast(`Penjualan kasbon untuk ${customerName} dicatat ke Hutang & Riwayat`, 'success');
    } else {
      showToast(`Pembayaran dari ${customerName} lunas & masuk ke Riwayat`, 'success');
    }
    if (onNavigateToHistory) {
      onNavigateToHistory();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#FAF8F5] border border-stone-200 rounded-t-3xl sm:rounded-2xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl animate-slide-up text-slate-900 pb-safe"
        role="dialog"
        aria-modal="true"
      >
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white sm:rounded-t-2xl shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isStockIn ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {isStockIn ? <ArrowDownRight className="w-5 h-5 stroke-[2.5]" /> : <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isStockIn ? 'Catat Barang Masuk (Beli)' : 'Catat Barang Keluar (Jual)'}
              </h2>
              <p className="text-[11px] text-stone-500 font-medium">
                {items.length > 0 ? `${items.length} barang dipilih • ${totalUnits} unit` : 'Pilih barang untuk transaksi'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 pb-2 bg-white border-b border-stone-100 shrink-0">
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('select')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 min-h-[36px] ${
                activeTab === 'select' ? 'bg-white text-slate-900 shadow-xs' : 'text-stone-500'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Pilih Barang</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 min-h-[36px] ${
                activeTab === 'review' ? 'bg-white text-orange-700 shadow-xs' : 'text-stone-500'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Daftar Transaksi ({items.length})</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0 space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'select' && (
            <DrawerSelectTab
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filteredProducts={filteredProducts}
              isStockIn={isStockIn}
              cartItemMap={cartItemMap}
              duplicateNameCountMap={duplicateNameCountMap}
              allowNegative={allowNegative}
              onAddProduct={handleAddProduct}
              onDecrementProduct={handleDecrementProduct}
              onDirectQuantityChange={handleDirectQuantityChange}
              onInputBlur={handleInputBlur}
            />
          )}

          {activeTab === 'review' && (
            <DrawerReviewTab
              items={items}
              isStockIn={isStockIn}
              allowNegative={allowNegative}
              onSetAllowNegative={setAllowNegative}
              onSelectTab={() => setActiveTab('select')}
              onUpdateQty={updateItemQty}
              onUpdatePrice={updateItemPrice}
              onUpdateNotes={updateItemNotes}
              onRemoveItem={handleRemoveItem}
            />
          )}
        </div>

        <DrawerBottomBar
          itemCount={items.length}
          totalUnits={totalUnits}
          totalValue={totalValue}
          activeTab={activeTab}
          isStockIn={isStockIn}
          isSubmitting={isSubmitting}
          onProceedToReview={() => setActiveTab('review')}
          onClose={onClose}
          onSubmit={handleSubmit}
        />

        {/* Modal Konfirmasi Pembayaran & Input Pelanggan */}
        <PaymentCheckoutModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          items={items.filter((i) => i.quantity > 0)}
          totalValue={totalValue}
          totalUnits={totalUnits}
          allowNegative={allowNegative}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
};
