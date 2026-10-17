import React from 'react';
import { X, ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface DrawerHeaderProps {
  isStockIn: boolean;
  itemsCount: number;
  totalUnits: number;
  onClose: () => void;
  onSwitchType: (type: 'IN' | 'OUT') => void;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  isStockIn,
  itemsCount,
  totalUnits,
  onClose,
  onSwitchType,
}) => {
  return (
    <div className="shrink-0 bg-white sm:rounded-t-2xl border-b border-stone-200">
      {/* Mobile drag bar */}
      <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
        <div className="w-12 h-1.5 rounded-full bg-stone-300" />
      </div>

      {/* Main Header Row */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isStockIn ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {isStockIn ? (
              <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {isStockIn ? 'Catat Barang Masuk (Beli)' : 'Catat Barang Keluar (Jual)'}
            </h2>
            <p className="text-[11px] text-stone-500 font-medium">
              {itemsCount > 0
                ? `${itemsCount} barang dipilih • ${totalUnits} unit`
                : 'Pilih barang untuk transaksi'}
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

      {/* Switcher: Jual barang anda / Tambah barang anda */}
      <div className="px-4 py-2 bg-stone-50/90 border-t border-stone-100 flex items-center justify-between">
        <span className="text-[11px] text-stone-600 font-medium">
          {isStockIn ? 'Ingin melayani pembeli?' : 'Ingin menambah stok gudang?'}
        </span>
        <button
          type="button"
          onClick={() => onSwitchType(isStockIn ? 'OUT' : 'IN')}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs active:scale-95 ${
            isStockIn
              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          {isStockIn ? (
            <>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Jual barang anda</span>
            </>
          ) : (
            <>
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tambah barang anda</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
