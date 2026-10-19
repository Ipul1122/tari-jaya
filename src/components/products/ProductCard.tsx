import React, { useState } from 'react';
import type { Product } from '../../db/schema';
import { formatCurrency, formatNumber, isLowStock, isCriticalStock } from '../../utils/formatters';
import { Plus, Minus, MoreVertical, Edit2, Trash2, Boxes } from 'lucide-react';
import { PopoverConfirm } from '../common/PopoverConfirm';

interface ProductCardProps {
  product: Product;
  onStockIn: (product: Product) => void;
  onStockOut: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onViewDetail?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onStockIn,
  onStockOut,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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
          <div className="flex items-center gap-2 mt-1">
            {/* Low stock badge */}
            {critical ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                Kritis: {formatNumber(product.current_stock)} unit
              </span>
            ) : low ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                Stok Menipis: {formatNumber(product.current_stock)}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-stone-600">
                Stok: <b className="text-slate-900">{formatNumber(product.current_stock)}</b> unit
              </span>
            )}
          </div>
        </div>

        {/* More Actions Dropdown Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-slate-900 hover:bg-stone-100 active:scale-95 transition"
            title="Opsi Produk"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-30 w-36 rounded-xl bg-white border border-stone-200 shadow-xl py-1 animate-fade-in">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onViewDetail?.(product);
                  }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                >
                  <Boxes className="w-3.5 h-3.5 text-orange-600" />
                  <span>Detail & Pasokan</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(product);
                  }}
                  className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ubah Produk</span>
                </button>

                {/* Text Button Delete RED -> Triggers Popover */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDeleteOpen(true);
                  }}
                  className="w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-stone-100 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span className="text-red-600">Hapus Produk</span>
                </button>
              </div>
            </>
          )}

          {/* Popover Confirmation for Delete Product */}
          <PopoverConfirm
            isOpen={confirmDeleteOpen}
            title={`Hapus "${product.name}"?`}
            description="Semua data mutasi barang ini juga akan ikut dihapus dari riwayat transaksi."
            confirmLabel="Ya, Hapus"
            cancelLabel="Batal"
            variant="danger"
            position="top-right"
            onConfirm={() => {
              setConfirmDeleteOpen(false);
              onDelete(product);
            }}
            onCancel={() => setConfirmDeleteOpen(false)}
          />
        </div>
      </div>

      {/* Pricing & Margin Grid */}
      <div className="mt-3 pt-2.5 border-t border-stone-100 grid grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-[10px] text-stone-500 block font-medium">Harga Modal</span>
          <span className="font-mono font-medium text-slate-700">
            {formatCurrency(product.cost_price)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-stone-500 block font-medium">Harga Jual</span>
          <span className="font-mono font-bold text-slate-900">
            {formatCurrency(product.selling_price)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-stone-500 block font-medium">Margin/Unit</span>
          <span className={`font-mono font-bold ${unitMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {unitMargin >= 0 ? '+' : ''}{formatCurrency(unitMargin)}
          </span>
        </div>
      </div>

      {/* Product Notes if present */}
      {product.notes && (
        <div className="mt-2 text-[11px] text-stone-600 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200/70 truncate">
          <span className="font-semibold text-stone-500">Catatan: </span>
          <span>{product.notes}</span>
        </div>
      )}

      {/* Action Buttons: Stock In & Stock Out */}
      <div className="mt-3 pt-2.5 border-t border-stone-100 grid grid-cols-2 gap-2">
        <button
          onClick={() => onStockIn(product)}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 active:scale-[0.98] transition font-bold text-xs min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-red-600 stroke-[3]" />
          <span className="text-red-700 font-bold">Masuk</span>
        </button>

        <button
          onClick={() => onStockOut(product)}
          className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 active:scale-[0.98] transition font-bold text-xs min-h-[44px]"
        >
          <Minus className="w-4 h-4 text-emerald-600 stroke-[3]" />
          <span className="text-emerald-700 font-bold">Keluar</span>
        </button>
      </div>
    </div>
  );
};
