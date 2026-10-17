import React from 'react';
import type { Product } from '../../db/schema';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { Plus, Minus } from 'lucide-react';

interface DrawerProductPickerItemProps {
  product: Product;
  isStockIn: boolean;
  qtyInCart: number;
  isSelected: boolean;
  isDuplicate: boolean;
  allowNegative: boolean;
  onAdd: (product: Product) => void;
  onDecrement: (productId: number) => void;
  onDirectQuantityChange: (product: Product, value: string) => void;
  onBlur: (productId: number) => void;
}

export const DrawerProductPickerItem: React.FC<DrawerProductPickerItemProps> = ({
  product,
  isStockIn,
  qtyInCart,
  isSelected,
  isDuplicate,
  allowNegative,
  onAdd,
  onDecrement,
  onDirectQuantityChange,
  onBlur,
}) => {
  const displayPrice = isStockIn ? product.cost_price : product.selling_price;
  const isLow = product.current_stock <= 9;
  const isMaxStockReached = !isStockIn && !allowNegative && qtyInCart >= product.current_stock;

  return (
    <div
      className={`p-3 rounded-2xl border transition shadow-2xs flex items-center justify-between gap-3 ${
        isSelected
          ? 'bg-orange-50/40 border-orange-300'
          : 'bg-white border-stone-200/90 hover:border-stone-300'
      }`}
    >
      {/* Product Meta */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          <h4 className="text-xs font-bold text-slate-900 truncate">{product.name}</h4>
          {isDuplicate && (
            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
              Wadah #{product.id}
            </span>
          )}
        </div>

        {/* Catatan / Vendor Note */}
        {product.notes ? (
          <div className="mt-1 flex items-center space-x-1.5 text-[11px] text-amber-900 bg-amber-50/90 px-2 py-0.5 rounded-lg border border-amber-200/80 max-w-fit">
            <span className="font-bold text-[10px] text-amber-700 uppercase tracking-wider shrink-0">
              Catatan:
            </span>
            <span className="font-medium truncate max-w-[220px]">{product.notes}</span>
          </div>
        ) : isDuplicate ? (
          <div className="mt-1 text-[10px] text-stone-400 italic">
            Tanpa catatan khusus
          </div>
        ) : null}

        <div className="flex items-center space-x-3 mt-1.5 text-[11px]">
          <span className="font-mono font-bold text-slate-800">
            {formatCurrency(displayPrice)}
          </span>
          <span className="text-stone-300">•</span>
          <span
            className={`font-mono text-[10px] font-semibold ${
              isLow ? 'text-red-600 font-bold' : 'text-stone-600'
            }`}
          >
            Stok: {formatNumber(product.current_stock)} unit
          </span>
        </div>
      </div>

      {/* Stepper / Input */}
      <div className="shrink-0">
        {isSelected ? (
          <div className="flex items-center space-x-1 bg-white border border-orange-300 rounded-xl p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onDecrement(product.id!)}
              className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-800 flex items-center justify-center font-bold active:scale-95 transition"
              title="Kurangi 1 unit"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qtyInCart === 0 ? '' : qtyInCart}
              onChange={(e) => onDirectQuantityChange(product, e.target.value)}
              onBlur={() => onBlur(product.id!)}
              onFocus={(e) => e.target.select()}
              placeholder="0"
              className="w-14 h-8 text-center font-mono font-bold text-xs text-orange-700 bg-orange-50/60 border border-orange-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
              title="Ketik jumlah unit"
            />
            <button
              type="button"
              disabled={isMaxStockReached}
              onClick={() => onAdd(product)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition ${
                isMaxStockReached
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed opacity-50'
                  : 'bg-orange-600 hover:bg-orange-700 text-white active:scale-95'
              }`}
              title={isMaxStockReached ? `Stok maksimal ${product.current_stock} unit` : 'Tambah 1 unit'}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : !isStockIn && !allowNegative && product.current_stock <= 0 ? (
          <span className="h-8 px-2.5 rounded-xl bg-stone-100 text-stone-400 font-bold text-[11px] flex items-center border border-stone-200 cursor-not-allowed">
            Habis
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(product)}
            className="h-8 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center space-x-1 active:scale-95 transition border border-orange-200"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Pilih</span>
          </button>
        )}
      </div>
    </div>
  );
};
