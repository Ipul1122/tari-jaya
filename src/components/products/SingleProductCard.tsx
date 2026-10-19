import React, { useState } from 'react';
import type { Product } from '../../db/schema';
import { formatCurrency, formatNumber, isLowStock, isCriticalStock } from '../../utils/formatters';
import { Plus, Minus, MoreVertical, Edit2, Trash2, Boxes } from 'lucide-react';
import { PopoverConfirm } from '../common/PopoverConfirm';

interface SingleProductCardProps {
  product: Product;
  onStockIn: (product: Product) => void;
  onStockOut: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onViewDetail?: (product: Product) => void;
}

export const SingleProductCard: React.FC<SingleProductCardProps> = ({
  product,
  onStockIn,
  onStockOut,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isConfirmDelete, setIsConfirmDelete] = useState<boolean>(false);

  const low = isLowStock(product.current_stock);
  const critical = isCriticalStock(product.current_stock);
  const unitMargin = product.selling_price - product.cost_price;

  return (
    <div
      className={`relative bg-white border rounded-2xl p-3.5 transition-all duration-200 shadow-sm ${
        low
          ? 'border-l-4 border-l-red-500 border-stone-200'
          : 'border-stone-200/90 hover:border-orange-300'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-2">
        <div
          onClick={() => onViewDetail?.(product)}
          className="flex-1 min-w-0 cursor-pointer group"
          title="Klik untuk melihat detail & riwayat pasokan barang"
        >
          <div className="flex items-center space-x-1.5">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug truncate group-hover:text-orange-600 transition">
              {product.name}
            </h3>
            <Boxes className="w-3.5 h-3.5 text-stone-400 group-hover:text-orange-500 transition shrink-0 opacity-0 group-hover:opacity-100" />
          </div>

          {product.notes && (
            <p className="text-[11px] text-stone-500 truncate mt-1 italic">
              {product.notes}
            </p>
          )}
        </div>

        {/* Action Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu Produk"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-slate-900 hover:bg-stone-100 transition"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-30 w-36 rounded-xl bg-white border border-stone-200 shadow-xl py-1 animate-fade-in">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onViewDetail?.(product);
                  }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                >
                  <Boxes className="w-3.5 h-3.5 text-orange-600" />
                  <span>Detail Pasokan</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit(product);
                  }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ubah Data</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsConfirmDelete(true);
                  }}
                  className="w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-stone-100 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Hapus Barang</span>
                </button>
              </div>
            </>
          )}

          <PopoverConfirm
            isOpen={isConfirmDelete}
            title={`Hapus "${product.name}"?`}
            description="Data barang beserta seluruh riwayat mutasi terkait akan dihapus permanen."
            confirmLabel="Ya, Hapus"
            cancelLabel="Batal"
            variant="danger"
            position="top-right"
            onConfirm={() => {
              setIsConfirmDelete(false);
              onDelete(product);
            }}
            onCancel={() => setIsConfirmDelete(false)}
          />
        </div>
      </div>

      {/* Pricing info */}
      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-baseline justify-between text-xs font-mono">
        <div>
          <span className="text-[11px] text-stone-500 font-sans block">Harga Jual:</span>
          <span className="font-bold text-slate-900 text-sm">{formatCurrency(product.selling_price)}</span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-stone-500 font-sans block">Modal: {formatCurrency(product.cost_price)}</span>
          <span className="text-emerald-700 font-bold text-xs">Margin: +{formatCurrency(unitMargin)}</span>
        </div>
      </div>

      {/* Stock Status Bar */}
      <div className="mt-3 flex items-center justify-between bg-stone-50/80 p-2 rounded-xl">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-stone-600 font-medium">Stok:</span>
          <span className={`text-base font-extrabold font-mono ${low ? 'text-red-600' : 'text-slate-900'}`}>
            {formatNumber(product.current_stock)}
          </span>
          <span className="text-xs text-stone-500">unit</span>
        </div>
        {low && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${critical ? 'bg-red-600 text-white animate-pulse' : 'bg-red-100 text-red-700'}`}>
            {critical ? 'Kritis' : 'Menipis'}
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button
          type="button"
          onClick={() => onStockIn(product)}
          className="py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition min-h-[44px]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Masuk</span>
        </button>
        <button
          type="button"
          onClick={() => onStockOut(product)}
          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition min-h-[44px]"
        >
          <Minus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
};
