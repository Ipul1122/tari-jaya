import React, { useState, useEffect } from 'react';
import type { BulkItemEntry } from './QuickInOutDrawer';
import { formatCurrency, formatNumber, formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface DrawerReviewItemRowProps {
  item: BulkItemEntry;
  index: number;
  isStockIn: boolean;
  allowNegative: boolean;
  onUpdateQty: (index: number, newQty: number) => void;
  onUpdatePrice: (index: number, newPrice: number) => void;
  onUpdateNotes: (index: number, newNotes: string) => void;
  onRemove: (index: number) => void;
}

export const DrawerReviewItemRow: React.FC<DrawerReviewItemRowProps> = ({
  item,
  index,
  isStockIn,
  allowNegative,
  onUpdateQty,
  onUpdatePrice,
  onUpdateNotes,
  onRemove,
}) => {
  const isInsufficient = !isStockIn && item.quantity > item.product.current_stock;
  const subtotal = item.quantity * item.unitPrice;
  const isMaxStockReached = !isStockIn && !allowNegative && item.quantity >= item.product.current_stock;

  const [qtyStr, setQtyStr] = useState<string>(String(item.quantity));

  useEffect(() => {
    setQtyStr(String(item.quantity));
  }, [item.quantity]);

  const handleQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setQtyStr(raw);

    if (raw === '') {
      // Izinkan input kosong sementara agar user bisa hapus total & ketik angka baru
      return;
    }

    const num = parseInt(raw, 10);
    if (num > 0) {
      const maxStock = item.product.current_stock;
      if (!isStockIn && !allowNegative && num > maxStock) {
        setQtyStr(String(maxStock));
        onUpdateQty(index, maxStock);
      } else {
        onUpdateQty(index, num);
      }
    }
  };

  const handleQtyBlur = () => {
    if (qtyStr === '' || parseInt(qtyStr, 10) <= 0) {
      setQtyStr('1');
      onUpdateQty(index, 1);
    }
  };

  return (
    <div
      className={`p-3 rounded-2xl bg-white border shadow-2xs space-y-2.5 ${
        isInsufficient ? 'border-red-400 bg-red-50/30' : 'border-stone-200'
      }`}
    >
      {/* Row 1: Item Name, Stock Info & Delete button */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-bold text-slate-900 truncate">
            {item.product.name}
          </h4>
          <span className="text-[10px] font-mono text-stone-500 block">
            Sisa stok: <b>{formatNumber(item.product.current_stock)}</b> unit
          </span>
          {item.product.notes && (
            <div className="mt-1 flex items-center space-x-1 text-[10px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80 max-w-fit">
              <span className="font-bold text-amber-700 uppercase tracking-wider shrink-0">Catatan:</span>
              <span className="truncate max-w-[200px]">{item.product.notes}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onRemove(index)}
          className="text-red-600 hover:text-red-700 font-bold text-xs p-1 rounded-lg hover:bg-red-50 flex items-center space-x-1 shrink-0 active:scale-95 transition min-h-[36px]"
          title="Hapus barang"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="text-[11px]">Hapus</span>
        </button>
      </div>

      {/* Row 2: Qty Stepper & Unit Price */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 text-xs">
        <div>
          <label className="block text-[10px] font-semibold text-stone-600 mb-1">
            Jumlah (Qty):
          </label>
          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={item.quantity <= 1}
              onClick={() => onUpdateQty(index, Math.max(1, item.quantity - 1))}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center font-bold transition ${
                item.quantity <= 1
                  ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-slate-800 active:scale-95'
              }`}
              title={item.quantity <= 1 ? 'Jumlah minimal 1 unit (gunakan Hapus untuk membatalkan)' : 'Kurangi 1 unit'}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qtyStr}
              onChange={handleQtyChange}
              onBlur={handleQtyBlur}
              onFocus={(e) => e.target.select()}
              placeholder="1"
              className="w-14 h-8 text-center rounded-lg bg-stone-50 border border-stone-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-orange-500"
              title="Ketik jumlah unit"
            />
            <button
              type="button"
              disabled={isMaxStockReached}
              onClick={() => onUpdateQty(index, item.quantity + 1)}
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition font-bold ${
                isMaxStockReached
                  ? 'bg-stone-200 text-stone-400 border-stone-200 cursor-not-allowed opacity-50'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-slate-800 active:scale-95'
              }`}
              title={isMaxStockReached ? `Stok maksimal ${item.product.current_stock} unit` : 'Tambah 1 unit'}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-stone-600 mb-1">
            {isStockIn ? 'Harga Modal (Rp):' : 'Harga Jual (Rp):'}
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-stone-400 select-none">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={item.unitPrice === 0 ? '' : formatRupiahInput(item.unitPrice)}
              onChange={(e) => onUpdatePrice(index, parseRupiahInput(e.target.value))}
              placeholder="0"
              className="w-full h-8 pl-8 pr-2 rounded-lg bg-stone-50 border border-stone-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-orange-500 min-h-[32px]"
            />
          </div>
        </div>
      </div>

      {/* Row 3: Notes (only for Stock Out) & Subtotal */}
      <div className={`flex items-center text-[11px] pt-1 border-t border-stone-100 ${
        isStockIn ? 'justify-end' : 'justify-between'
      }`}>
        {!isStockIn && (
          <input
            type="text"
            value={item.notes || ''}
            onChange={(e) => onUpdateNotes(index, e.target.value)}
            placeholder="Catatan material (contoh: diantar pick-up / ambil sendiri)..."
            className="flex-1 mr-2 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-slate-800 text-[10px] focus:outline-none focus:border-orange-500"
          />
        )}
        <div className="text-right shrink-0">
          <span className="text-stone-500 text-[10px]">Subtotal: </span>
          <b className="font-mono text-slate-900 font-bold">{formatCurrency(subtotal)}</b>
        </div>
      </div>
    </div>
  );
};
