import React from 'react';
import type { HistoryGroupContainer } from '../../utils/historyGrouping';
import type { MutationWithProduct } from '../../hooks/useMutations';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import {
  User,
  PackagePlus,
  ShoppingBag,
  ChevronDown,
  Undo2,
  TrendingUp,
  Clock,
  BookOpenText,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
} from 'lucide-react';

interface HistoryContainerCardProps {
  container: HistoryGroupContainer;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onVoidMutation: (mutation: MutationWithProduct) => void;
  onViewReceipt?: (container: HistoryGroupContainer) => void;
}

export const HistoryContainerCard: React.FC<HistoryContainerCardProps> = ({
  container,
  isExpanded,
  onToggleExpand,
  onVoidMutation,
  onViewReceipt,
}) => {
  const isStockIn = container.type === 'IN';

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isWalkIn = container.title.toLowerCase().includes('umum') || container.title.toLowerCase().includes('tanpa nama');

  return (
    <div className={`rounded-2xl bg-white border shadow-xs overflow-hidden transition-all duration-200 ${
      isStockIn ? 'border-emerald-200/90' : 'border-stone-200/90'
    }`}>
      {/* Container Header Bar */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full text-left p-3.5 flex items-center justify-between hover:bg-stone-50/80 active:bg-stone-100/80 transition select-none min-h-[58px]"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1 mr-2">
          {/* Avatar Icon */}
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
              isStockIn
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : isWalkIn
                ? 'bg-stone-100 text-stone-600 border border-stone-200'
                : container.hasKasbon
                ? 'bg-sky-100 text-sky-800 border border-sky-200'
                : 'bg-rose-100 text-rose-800 border border-rose-200'
            }`}
          >
            {isStockIn ? (
              <PackagePlus className="w-5 h-5 text-emerald-700" />
            ) : isWalkIn ? (
              <User className="w-5 h-5 text-stone-500" />
            ) : (
              getInitials(container.title)
            )}
          </div>

          {/* Title & Badges */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-extrabold text-slate-900 truncate">
                {container.title}
              </h4>
              {isStockIn ? (
                <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                  <span>Masuk</span>
                </span>
              ) : container.hasKasbon ? (
                <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                  <BookOpenText className="w-3 h-3" />
                  <span>Kasbon</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                  <ArrowUpRight className="w-3 h-3 text-rose-600" />
                  <span>Penjualan</span>
                </span>
              )}
            </div>

            <p className="text-[11px] text-stone-500 font-medium mt-0.5 truncate">
              {container.itemTypesCount} Jenis Barang • {formatNumber(container.totalUnits)} unit {isStockIn ? 'diterima' : 'keluar'}
            </p>
          </div>
        </div>

        {/* Right Total & Expand Arrow */}
        <div className="flex items-center space-x-2.5 shrink-0 text-right">
          <div>
            <div className={`text-sm font-black ${isStockIn ? 'text-emerald-800' : 'text-slate-900'}`}>
              {formatCurrency(container.totalValue)}
            </div>
            {isStockIn ? (
              <div className="text-[10px] font-bold text-stone-400">
                Modal Beli
              </div>
            ) : (
              <div className="text-[10px] font-bold text-emerald-700 flex items-center justify-end space-x-0.5">
                <TrendingUp className="w-2.5 h-2.5" />
                <span>+{formatCurrency(container.totalProfit)}</span>
              </div>
            )}
          </div>

          <div
            className={`w-7 h-7 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 transition-transform duration-200 ${
              isExpanded
                ? isStockIn
                  ? 'rotate-180 bg-emerald-100 text-emerald-800'
                  : 'rotate-180 bg-orange-100 text-orange-700'
                : ''
            }`}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      {/* Inside Container: List of Items */}
      {isExpanded && (
        <div className="border-t border-stone-100 bg-[#FAF8F5]/60 px-3.5 py-3 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
            <span>
              {isStockIn ? 'Rincian Barang Masuk:' : `Rincian Pembelian oleh ${container.title}:`}
            </span>
            <span className="text-[10px] font-medium text-stone-400">
              {container.mutations.length} barang
            </span>
          </div>

          <div className="space-y-1.5">
            {container.mutations.map((m) => {
              const subtotal = isStockIn
                ? m.quantity * m.unit_cost
                : m.quantity * m.unit_price;
              const formattedTime = new Date(m.timestamp).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5">
                      {isStockIn ? (
                        <PackagePlus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <ShoppingBag className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {m.product_name}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-stone-500 mt-0.5">
                      <span className="font-semibold text-slate-700">
                        {m.quantity} unit @ {formatCurrency(isStockIn ? m.unit_cost : m.unit_price)}
                      </span>
                      <span>•</span>
                      <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formattedTime}
                      </span>
                    </div>

                    {m.notes && (
                      <p className="text-[10px] text-stone-500 mt-1 italic truncate">
                        Catatan: {m.notes}
                      </p>
                    )}
                  </div>

                  {/* Subtotal & Void button */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="text-right">
                      <p className={`text-xs font-black ${isStockIn ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(subtotal)}
                      </p>
                      {!isStockIn && (
                        <p className="text-[10px] font-bold text-emerald-600">
                          +{formatCurrency(m.gross_profit)}
                        </p>
                      )}
                    </div>

                    {m.id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onVoidMutation(m);
                        }}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 active:scale-95 transition min-w-[34px] min-h-[34px] flex items-center justify-center border border-stone-100"
                        title="Batalkan item ini"
                        aria-label={`Batalkan mutasi ${m.product_name}`}
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Container Total Footer Bar */}
          <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-xs font-extrabold text-slate-900">
            <div>
              <span className="text-[11px] text-stone-500 block">
                Total {isStockIn ? 'Pengadaan' : 'Belanja'} ({formatNumber(container.totalUnits)} unit)
              </span>
              {!isStockIn && onViewReceipt && (
                <button
                  type="button"
                  onClick={() => onViewReceipt(container)}
                  className="mt-1.5 inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[11px] font-bold active:scale-95 transition"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Cetak Struk</span>
                </button>
              )}
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-slate-900">{formatCurrency(container.totalValue)}</span>
              {!isStockIn && (
                <span className="text-[10px] text-emerald-600 block font-semibold">
                  Untung: {formatCurrency(container.totalProfit)}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
