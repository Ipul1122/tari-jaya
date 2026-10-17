import React from 'react';
import type { BulkItemEntry } from './QuickInOutDrawer';
import { DrawerReviewItemRow } from './DrawerReviewItemRow';
import { ShoppingBag, Search, AlertTriangle } from 'lucide-react';

interface DrawerReviewTabProps {
  items: BulkItemEntry[];
  isStockIn: boolean;
  allowNegative: boolean;
  onSetAllowNegative: (val: boolean) => void;
  onSelectTab: () => void;
  onUpdateQty: (index: number, newQty: number) => void;
  onUpdatePrice: (index: number, newPrice: number) => void;
  onUpdateNotes: (index: number, newNotes: string) => void;
  onRemoveItem: (index: number) => void;
}

export const DrawerReviewTab: React.FC<DrawerReviewTabProps> = ({
  items,
  isStockIn,
  allowNegative,
  onSetAllowNegative,
  onSelectTab,
  onUpdateQty,
  onUpdatePrice,
  onUpdateNotes,
  onRemoveItem,
}) => {
  if (items.length === 0) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center text-stone-500 space-y-3">
        <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
        <div>
          <h4 className="text-xs font-bold text-slate-800">Daftar transaksi masih kosong</h4>
          <p className="text-[11px] text-stone-400 mt-0.5">
            Pilih barang terlebih dahulu di tab "Pilih Barang".
          </p>
        </div>
        <button
          type="button"
          onClick={onSelectTab}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs active:scale-95 transition min-h-[44px]"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Pilih Barang Sekarang</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
          Detail Item ({items.length})
        </span>
        <button
          type="button"
          onClick={onSelectTab}
          className="text-orange-600 hover:text-orange-700 font-bold text-[11px] flex items-center space-x-0.5"
        >
          <span>Tambah Lain</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {items.map((item, index) => (
          <DrawerReviewItemRow
            key={`${item.productId}-${index}`}
            item={item}
            index={index}
            isStockIn={isStockIn}
            allowNegative={allowNegative}
            onUpdateQty={onUpdateQty}
            onUpdatePrice={onUpdatePrice}
            onUpdateNotes={onUpdateNotes}
            onRemove={onRemoveItem}
          />
        ))}
      </div>

      {/* Allow Negative Checkbox for Stock Out */}
      {!isStockIn && (
        <label className="flex items-start space-x-2 p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allowNegative}
            onChange={(e) => onSetAllowNegative(e.target.checked)}
            className="mt-0.5 rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
          />
          <div className="text-xs">
            <span className="font-bold text-amber-900 block flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Izinkan Pengeluaran Melebihi Stok</span>
            </span>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Aktifkan jika stok fisik di toko masih ada tapi belum sempat diinput.
            </p>
          </div>
        </label>
      )}
    </div>
  );
};
