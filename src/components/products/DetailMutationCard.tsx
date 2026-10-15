import React from 'react';
import type { StockMutation } from '../../db/schema';
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

interface DetailMutationCardProps {
  mutation: StockMutation;
}

export const DetailMutationCard: React.FC<DetailMutationCardProps> = ({ mutation }) => {
  const isIn = mutation.type === 'IN';
  const subtotal = isIn ? mutation.quantity * mutation.unit_cost : mutation.quantity * mutation.unit_price;

  return (
    <div className="p-3 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2 text-slate-900">
      {/* Top Row: Type Badge, Date, Qty */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isIn ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {isIn ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
          </div>
          <div>
            <span className="text-[10px] text-stone-500 block font-medium">
              {formatDateTime(mutation.timestamp)}
            </span>
            <span className="text-xs font-bold text-slate-900">
              {isIn ? 'Pasokan Masuk' : 'Penjualan'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`text-xs font-mono font-bold ${
              isIn ? 'text-orange-600' : 'text-red-600'
            }`}
          >
            {isIn ? '+' : '-'}{formatNumber(mutation.quantity)} unit
          </span>
          <span className="block text-[11px] font-mono text-stone-600 font-semibold">
            {formatCurrency(subtotal)}
          </span>
        </div>
      </div>

      {/* Middle Row: Rate & Profit */}
      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-100">
        <span className="text-stone-600">
          {isIn ? 'Harga Beli: ' : 'Harga Jual: '}
          <b className="font-mono text-slate-900 font-bold">
            {formatCurrency(isIn ? mutation.unit_cost : mutation.unit_price)}
          </b>
        </span>

        {!isIn && (
          <span className="text-stone-600">
            Laba: <b className="font-mono text-emerald-700 font-bold">+{formatCurrency(mutation.gross_profit)}</b>
          </span>
        )}
      </div>

      {/* Bottom Row: Note / Vendor Info */}
      {mutation.notes && (
        <div className="pt-1 text-[11px] text-stone-600 bg-stone-50 px-2 py-1 rounded-lg border border-stone-100 flex items-start space-x-1">
          <span className="font-semibold text-stone-500 shrink-0">Catatan/Vendor:</span>
          <span className="italic text-slate-800">{mutation.notes}</span>
        </div>
      )}
    </div>
  );
};
