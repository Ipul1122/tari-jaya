import React, { useState } from 'react';
import type { MutationWithProduct } from '../../hooks/useMutations';
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters';
import { ArrowDownRight, ArrowUpRight, RotateCcw } from 'lucide-react';
import { PopoverConfirm } from '../common/PopoverConfirm';

interface MutationListItemProps {
  mutation: MutationWithProduct;
  onVoid: (mutationId: number) => Promise<void>;
}

export const MutationListItem: React.FC<MutationListItemProps> = ({ mutation, onVoid }) => {
  const [showConfirmVoid, setShowConfirmVoid] = useState<boolean>(false);

  const isIn = mutation.type === 'IN';
  const totalAmount = isIn
    ? mutation.quantity * mutation.unit_cost
    : mutation.quantity * mutation.unit_price;

  const handleConfirmVoid = async () => {
    setShowConfirmVoid(false);
    await onVoid(mutation.id!);
  };

  const rollbackDescription = isIn
    ? `Stok "${mutation.product_name}" akan dikurangi ${mutation.quantity} unit kembali ke nilai sebelum transaksi masuk ini.`
    : `Stok "${mutation.product_name}" akan ditambah ${mutation.quantity} unit kembali ke nilai sebelum transaksi keluar ini.`;

  return (
    <div className="relative bg-white border border-stone-200/90 rounded-2xl p-3.5 shadow-sm space-y-2.5 text-slate-900">
      {/* Top row: Type badge, product name, quantity */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isIn
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-red-100 text-red-700 border border-red-200'
            }`}
          >
            {isIn ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
          </div>
          <div className="truncate">
            <h4 className="text-xs font-bold text-slate-900 truncate">{mutation.product_name}</h4>
            <span className="text-[10px] text-stone-500 block font-medium">
              {formatDateTime(mutation.timestamp)}
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span
            className={`text-sm font-mono font-bold ${
              isIn ? 'text-orange-600' : 'text-red-600'
            }`}
          >
            {isIn ? '+' : '-'}{formatNumber(mutation.quantity)} unit
          </span>
          <span className="block text-[11px] font-mono text-stone-600 font-semibold">
            {formatCurrency(totalAmount)}
          </span>
        </div>
      </div>

      {/* Middle row: Rates & Profit */}
      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-stone-100">
        <span className="text-stone-600 font-medium">
          {isIn ? 'Harga Beli: ' : 'Harga Jual: '}
          <b className="font-mono text-slate-900 font-bold">
            {formatCurrency(isIn ? mutation.unit_cost : mutation.unit_price)}
          </b>
        </span>

        {!isIn && (
          <span className="text-stone-600 font-medium">
            Laba: <b className="font-mono text-emerald-700 font-bold">+{formatCurrency(mutation.gross_profit)}</b>
          </span>
        )}
      </div>

      {/* Notes & Void action (Text Button Delete/Void RED with Popover) */}
      <div className="flex items-center justify-between pt-1 text-[11px]">
        <span className="text-stone-500 italic truncate max-w-[200px]">
          {mutation.notes ? `"${mutation.notes}"` : 'Tanpa catatan'}
        </span>

        <div className="relative">
          <button
            onClick={() => setShowConfirmVoid(!showConfirmVoid)}
            className="flex items-center space-x-1 px-2 py-1 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 active:scale-95 transition font-bold"
            title="Batalkan mutasi dan rollback stok"
          >
            <RotateCcw className="w-3 h-3 text-red-600" />
            <span className="text-[10px] text-red-600 font-bold">Batalkan</span>
          </button>

          {/* Anchored Popover Confirmation */}
          <PopoverConfirm
            isOpen={showConfirmVoid}
            title="Batalkan Transaksi?"
            description={rollbackDescription}
            confirmLabel="Ya, Batalkan"
            cancelLabel="Kembali"
            variant="danger"
            position="top-right"
            onConfirm={handleConfirmVoid}
            onCancel={() => setShowConfirmVoid(false)}
          />
        </div>
      </div>
    </div>
  );
};
