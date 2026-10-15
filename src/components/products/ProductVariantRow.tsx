import React, { useState } from 'react';
import type { Product } from '../../db/schema';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { 
  Plus, 
  Minus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Boxes 
} from 'lucide-react';
import { PopoverConfirm } from '../common/PopoverConfirm';

interface ProductVariantRowProps {
  item: Product;
  index: number;
  onStockIn: (product: Product) => void;
  onStockOut: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onViewDetail?: (product: Product) => void;
}

export const ProductVariantRow: React.FC<ProductVariantRowProps> = ({
  item,
  index,
  onStockIn,
  onStockOut,
  onEdit,
  onDelete,
  onViewDetail,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);

  const itemMargin = item.selling_price - item.cost_price;

  return (
    <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-2 text-xs">
      {/* Sub-item Top: Batch Tag, Stock, Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-slate-900 text-xs">
              Wadah #{index + 1}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-mono font-medium">
              ID #{item.id}
            </span>
          </div>

          <div className="mt-1 flex items-center space-x-2 font-mono text-[11px]">
            <span className="font-bold text-slate-900">
              Stok: <b className="text-orange-600">{formatNumber(item.current_stock)}</b> unit
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-600">
              Modal: {formatCurrency(item.cost_price)}
            </span>
          </div>
        </div>

        {/* Sub-item Actions Dropdown */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-slate-900 hover:bg-stone-100 transition"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-30 w-36 rounded-xl bg-white border border-stone-200 shadow-xl py-1 animate-fade-in">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onViewDetail?.(item);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-left text-slate-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                >
                  <Boxes className="w-3.5 h-3.5 text-orange-600" />
                  <span>Detail Pasokan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onEdit(item);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-left text-slate-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ubah Data</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsConfirmDeleteOpen(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-stone-100 font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Hapus Wadah Ini</span>
                </button>
              </div>
            </>
          )}

          <PopoverConfirm
            isOpen={isConfirmDeleteOpen}
            title={`Hapus wadah #${index + 1} (${item.name})?`}
            description="Hanya data wadah ini yang akan dihapus."
            confirmLabel="Ya, Hapus"
            cancelLabel="Batal"
            variant="danger"
            position="top-right"
            onConfirm={() => {
              setIsConfirmDeleteOpen(false);
              onDelete(item);
            }}
            onCancel={() => setIsConfirmDeleteOpen(false)}
          />
        </div>
      </div>

      {/* Catatan / Alasan info */}
      {item.notes ? (
        <div className="p-2 rounded-lg bg-stone-50 border border-stone-200/70 text-[11px] text-stone-700">
          <b className="text-stone-500 font-semibold block text-[10px]">Catatan / Vendor:</b>
          <span className="italic font-medium">{item.notes}</span>
        </div>
      ) : (
        <div className="text-[10px] text-stone-400 italic">
          Tanpa catatan khusus
        </div>
      )}

      {/* Pricing row */}
      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100 font-mono">
        <span className="text-stone-600">
          Jual: <b className="text-slate-900">{formatCurrency(item.selling_price)}</b>
        </span>
        <span className="text-emerald-700 font-bold">
          Margin: +{formatCurrency(itemMargin)}
        </span>
      </div>

      {/* Buttons: + Masuk & - Keluar */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => onStockIn(item)}
          className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-2xs active:scale-95 transition min-h-[44px]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>+ Masuk</span>
        </button>
        <button
          type="button"
          onClick={() => onStockOut(item)}
          className="py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-2xs active:scale-95 transition min-h-[44px]"
        >
          <Minus className="w-3.5 h-3.5 stroke-[3]" />
          <span>- Keluar</span>
        </button>
      </div>
    </div>
  );
};
