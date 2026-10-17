import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Product } from '../../db/schema';
import type { ReceiptData } from '../../types/receipt';
import { recordBulkStockIn } from '../../db/operations';
import { DrawerHeader } from './DrawerHeader';
import { DrawerSelectTab } from './DrawerSelectTab';
import { DrawerReviewTab } from './DrawerReviewTab';
import { DrawerBottomBar } from './DrawerBottomBar';
import { PaymentCheckoutModal } from './PaymentCheckoutModal';
import { useDrawerCart } from './useDrawerCart';
import { AlertCircle, Search, ListPlus } from 'lucide-react';
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
  onSuccess: (receipt?: ReceiptData) => void;
  onNavigateToHistory?: () => void;
  onOpenAddNewProduct?: (initialName?: string) => void;
  onSwitchType?: (type: 'IN' | 'OUT') => void;
}

export const QuickInOutDrawer: React.FC<QuickInOutDrawerProps> = ({
  isOpen,
  onClose,
  type,
  selectedProduct,
  products,
  onSuccess,
  onNavigateToHistory,
  onOpenAddNewProduct,
  onSwitchType,
}) => {
  const { showToast } = useToast();
  const [currentType, setCurrentType] = useState<'IN' | 'OUT'>(type);
  const [activeTab, setActiveTab] = useState<'select' | 'review'>('select');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [allowNegative, setAllowNegative] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setCurrentType(type); }, [type]);
  const isStockIn = currentType === 'IN';

  const {
    items, setItems, cartItemMap, totalUnits, totalValue,
    handleAddProduct, handleDecrementProduct, handleDirectQuantityChange,
    handleInputBlur, updateItemQty, updateItemPrice, updateItemNotes, handleRemoveItem,
  } = useDrawerCart(isStockIn, allowNegative);

  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) { prevOpenRef.current = false; return; }
    if (!prevOpenRef.current) {
      prevOpenRef.current = true;
      setError(null);
      setAllowNegative(false);
      setSearchQuery('');

      if (selectedProduct) {
        const fresh = products.find((p) => p.id === selectedProduct.id) || selectedProduct;
        setItems([{
          productId: fresh.id!,
          product: fresh,
          quantity: 1,
          unitPrice: isStockIn ? fresh.cost_price : fresh.selling_price,
          notes: '',
        }]);
        setActiveTab('review');
      } else {
        setItems([]);
        setActiveTab('select');
      }
    }
  }, [isOpen, selectedProduct, isStockIn, products, setItems]);

  const handleSwitchType = (newType: 'IN' | 'OUT') => {
    setCurrentType(newType);
    if (onSwitchType) onSwitchType(newType);
    setError(null);
    setItems((prev) => prev.map((item) => ({
      ...item,
      unitPrice: newType === 'IN' ? item.product.cost_price : item.product.selling_price,
    })));
  };

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
    return products.filter((p) => p.name.toLowerCase().includes(q) || (p.notes && p.notes.toLowerCase().includes(q)));
  }, [products, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const validItems = items.filter((i) => i.quantity > 0);
    if (validItems.length === 0) { setError('Pilih minimal 1 barang untuk dicatat'); return; }

    if (!isStockIn && !allowNegative) {
      for (const item of validItems) {
        if (item.quantity > item.product.current_stock) {
          setError(`Stok "${item.product.name}" tidak mencukupi (sisa ${item.product.current_stock} unit)`);
          return;
        }
      }
    }

    if (!isStockIn) { setIsPaymentModalOpen(true); return; }

    setIsSubmitting(true);
    try {
      await recordBulkStockIn(validItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitCost: item.unitPrice,
      })));
      showToast(`Berhasil mencatat stok masuk untuk ${validItems.length} jenis barang`, 'success');
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('tari-mutations-updated'));
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (customerName: string, isKasbon: boolean, receipt?: ReceiptData) => {
    setIsPaymentModalOpen(false);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('tari-mutations-updated'));
    onSuccess(receipt);
    onClose();
    showToast(isKasbon ? `Penjualan kasbon untuk ${customerName} dicatat ke Piutang & Riwayat` : `Pembayaran dari ${customerName} lunas`, 'success');
    if (onNavigateToHistory) onNavigateToHistory();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#FAF8F5] border border-stone-200 rounded-t-3xl sm:rounded-2xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl animate-slide-up text-slate-900 pb-safe"
        role="dialog"
        aria-modal="true"
      >
        <DrawerHeader isStockIn={isStockIn} itemsCount={items.length} totalUnits={totalUnits} onClose={onClose} onSwitchType={handleSwitchType} />

        <div className="px-4 pt-3 pb-2 bg-white border-b border-stone-100 shrink-0">
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('select')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 min-h-[36px] ${activeTab === 'select' ? 'bg-white text-slate-900 shadow-xs' : 'text-stone-500'}`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Pilih Barang</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 min-h-[36px] ${activeTab === 'review' ? 'bg-white text-orange-700 shadow-xs' : 'text-stone-500'}`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Daftar Transaksi ({items.length})</span>
            </button>
          </div>
        </div>

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
              onOpenAddNewProduct={onOpenAddNewProduct}
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
