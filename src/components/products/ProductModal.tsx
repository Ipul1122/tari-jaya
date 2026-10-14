import React, { useState, useEffect } from 'react';
import type { Product, Category } from '../../db/schema';
import { formatCurrency, formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { X, PackagePlus, Save, AlertCircle } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    id?: number;
    name: string;
    category_id: number;
    current_stock: number;
    cost_price: number;
    selling_price: number;
    notes?: string;
  }) => Promise<void>;
  productToEdit?: Product | null;
  categories: Category[];
  onOpenCategoryManager?: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  categories,
  onOpenCategoryManager,
}) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategoryId(productToEdit.category_id);
      setCostPrice(productToEdit.cost_price);
      setSellingPrice(productToEdit.selling_price);
      setInitialStock(productToEdit.current_stock);
      setNotes(productToEdit.notes || '');
    } else {
      setName('');
      setCategoryId(categories[0]?.id || 1);
      setCostPrice(0);
      setSellingPrice(0);
      setInitialStock(0);
      setNotes('');
    }
    setError(null);
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const unitMargin = sellingPrice - costPrice;
  const marginPercentage = costPrice > 0 ? ((unitMargin / costPrice) * 100).toFixed(1) : '0';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama barang tidak boleh kosong.');
      return;
    }
    if (costPrice < 0) {
      setError('Harga beli/modal tidak boleh negatif.');
      return;
    }
    if (sellingPrice < 0) {
      setError('Harga jual tidak boleh negatif.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        id: productToEdit?.id,
        name: name.trim(),
        category_id: categoryId,
        cost_price: Math.round(costPrice),
        selling_price: Math.round(sellingPrice),
        current_stock: Math.round(initialStock),
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Terjadi kesalahan saat menyimpan barang.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#FAF8F5] border border-stone-200 rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-slide-up text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-white sm:rounded-t-2xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {productToEdit ? 'Ubah Informasi Barang' : 'Tambah Barang Baru'}
              </h2>
              <p className="text-xs text-stone-500">
                {productToEdit ? 'Perbarui harga dan kategori barang' : 'Simpan katalog ke database lokal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-slate-900 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-2 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Nama Barang */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Nama Barang <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Beras Rojo Lele 5kg"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-slate-900 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {/* Kategori */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-900">
                Kategori Barang <span className="text-red-500">*</span>
              </label>
              {onOpenCategoryManager && (
                <button
                  type="button"
                  onClick={onOpenCategoryManager}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-bold"
                >
                  + Kelola Kategori
                </button>
              )}
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-slate-900 text-sm focus:outline-none focus:border-orange-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Harga Modal/Beli (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-stone-400 select-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={costPrice === 0 ? '' : formatRupiahInput(costPrice)}
                  onChange={(e) => setCostPrice(parseRupiahInput(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-stone-300 text-slate-900 font-mono text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Harga Jual (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-stone-400 select-none">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={sellingPrice === 0 ? '' : formatRupiahInput(sellingPrice)}
                  onChange={(e) => setSellingPrice(parseRupiahInput(e.target.value))}
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-stone-300 text-slate-900 font-mono text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Real-time Profit Preview Card */}
          <div className="p-3 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-stone-500 block text-[11px] font-medium">Margin / Laba per Unit:</span>
              <span className={`font-mono font-bold text-sm ${unitMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {unitMargin >= 0 ? '+' : ''}{formatCurrency(unitMargin)} ({marginPercentage}%)
              </span>
            </div>
            <div className="text-right text-[11px] font-semibold text-stone-600">
              {unitMargin > 0 ? 'Margin Sehat' : unitMargin === 0 ? 'Harga Modal' : 'Potensi Rugi'}
            </div>
          </div>

          {/* Stok Awal */}
          {!productToEdit && (
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1.5">
                Stok Awal di Toko/Gudang (Unit)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={initialStock === 0 ? '' : initialStock}
                onChange={(e) => setInitialStock(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-slate-900 font-mono text-sm focus:outline-none focus:border-orange-500"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                *Akan otomatis dicatat sebagai transaksi Stock IN pertama.
              </p>
            </div>
          )}

          {/* Catatan Barang (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              Catatan Barang (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Titipan supplier X / Dus sedikit penyok"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-300 text-slate-900 placeholder-stone-400 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Action Button: Text Button Simpan BLUE */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 active:scale-[0.98] transition disabled:opacity-50 min-h-[48px]"
            >
              <Save className="w-4 h-4 text-white" />
              <span className="text-white font-bold">{isSubmitting ? 'Menyimpan...' : 'Simpan Data Barang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
