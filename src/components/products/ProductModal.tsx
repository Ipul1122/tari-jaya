import React, { useState, useEffect, useMemo } from 'react';
import type { Product } from '../../db/schema';
import { formatCurrency, formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { DuplicateProductNotice } from './DuplicateProductNotice';
import { X, PackagePlus, Save, AlertCircle } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: number;
    name: string;
    category_id?: number;
    current_stock: number;
    cost_price: number;
    selling_price: number;
    notes?: string;
  }) => Promise<void>;
  productToEdit?: Product | null;
  initialName?: string;
  existingProducts?: Product[];
  onOpenStockInForExisting?: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  initialName = '',
  existingProducts = [],
  onOpenStockInForExisting,
}) => {
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCostPrice(productToEdit.cost_price);
      setSellingPrice(productToEdit.selling_price);
      setInitialStock(productToEdit.current_stock);
      setNotes(productToEdit.notes || '');
    } else {
      setName(initialName || '');
      setCostPrice(0);
      setSellingPrice(0);
      setInitialStock(0);
      setNotes('');
    }
    setError(null);
  }, [productToEdit, initialName, isOpen]);

  const duplicateProduct = useMemo(() => {
    if (productToEdit || !name.trim() || existingProducts.length === 0) return null;
    const target = name.trim().toLowerCase();
    return existingProducts.find((p) => p.name.trim().toLowerCase() === target) || null;
  }, [name, productToEdit, existingProducts]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama barang wajib diisi');
      return;
    }
    if (costPrice < 0) {
      setError('Harga beli tidak boleh negatif');
      return;
    }
    if (sellingPrice < 0) {
      setError('Harga jual tidak boleh negatif');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: productToEdit?.id,
        name: name.trim(),
        category_id: productToEdit?.category_id || undefined,
        current_stock: Math.round(initialStock),
        cost_price: Math.round(costPrice),
        selling_price: Math.round(sellingPrice),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan barang';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-sm rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {productToEdit ? 'Ubah Barang' : 'Tambah Barang Baru'}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">Katalog Stok Toko</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {duplicateProduct && (
            <DuplicateProductNotice
              duplicateProduct={duplicateProduct}
              onClose={onClose}
              onOpenStockInForExisting={onOpenStockInForExisting}
            />
          )}

          <div>
            <label htmlFor="productName" className="text-xs font-bold text-slate-900 block mb-1">
              Nama Material / Barang <span className="text-red-500">*</span>
            </label>
            <input
              id="productName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Semen Gresik 50kg, Besi Beton 10mm SNI, Cat Dulux 5kg"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-semibold text-slate-900 min-h-[44px]"
              autoFocus
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="productCostPrice" className="text-xs font-bold text-slate-900 block mb-1">
                Harga Modal (Beli)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  Rp
                </span>
                <input
                  id="productCostPrice"
                  type="text"
                  inputMode="numeric"
                  value={formatRupiahInput(costPrice)}
                  onChange={(e) => setCostPrice(parseRupiahInput(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-900 min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="productSellingPrice" className="text-xs font-bold text-slate-900 block mb-1">
                Harga Jual
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                  Rp
                </span>
                <input
                  id="productSellingPrice"
                  type="text"
                  inputMode="numeric"
                  value={formatRupiahInput(sellingPrice)}
                  onChange={(e) => setSellingPrice(parseRupiahInput(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-900 min-h-[44px]"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="productStock" className="text-xs font-bold text-slate-900 block mb-1">
              {productToEdit ? 'Sisa Stok Saat Ini' : 'Stok Awal'}
            </label>
            <div className="relative">
              <input
                id="productStock"
                type="text"
                inputMode="numeric"
                value={initialStock === 0 ? '' : initialStock}
                onChange={(e) => setInitialStock(parseRupiahInput(e.target.value))}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-slate-900 min-h-[44px]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-stone-400">
                unit
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="productNotes" className="text-xs font-bold text-slate-900 block mb-1">
              Catatan / Nama Supplier <span className="text-stone-400 font-normal">(opsional)</span>
            </label>
            <input
              id="productNotes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Distributor PT Semen Padang, Toko Besi Abadi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs text-slate-900 min-h-[44px]"
            />
          </div>

          {sellingPrice > 0 && costPrice > 0 && (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-between text-xs text-stone-600">
              <span>Estimasi Laba per Unit:</span>
              <span className="font-bold text-emerald-700">
                {formatCurrency(sellingPrice - costPrice)} ({(((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(0)}%)
              </span>
            </div>
          )}

          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 active:scale-95 transition min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition min-h-[44px] flex items-center justify-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{productToEdit ? 'Simpan' : 'Tambah Barang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
