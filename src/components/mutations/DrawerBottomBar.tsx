import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { ChevronRight, Save, Banknote } from 'lucide-react';

interface DrawerBottomBarProps {
  itemCount: number;
  totalUnits: number;
  totalValue: number;
  activeTab: 'select' | 'review';
  isStockIn: boolean;
  isSubmitting: boolean;
  onProceedToReview: () => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const DrawerBottomBar: React.FC<DrawerBottomBarProps> = ({
  itemCount,
  totalUnits,
  totalValue,
  activeTab,
  isStockIn,
  isSubmitting,
  onProceedToReview,
  onClose,
  onSubmit,
}) => {
  return (
    <div className="p-4 bg-white border-t border-stone-200 shrink-0 space-y-2">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-stone-500 font-medium">
          Total {itemCount} Barang ({formatNumber(totalUnits)} unit):
        </span>
        <span className="text-base font-extrabold font-mono text-slate-900">
          {formatCurrency(totalValue)}
        </span>
      </div>

      <div className="flex space-x-2">
        {activeTab === 'select' && itemCount > 0 ? (
          <button
            type="button"
            onClick={onProceedToReview}
            className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition flex items-center justify-center space-x-1.5 min-h-[46px]"
          >
            <span>Lanjut ke Konfirmasi ({itemCount})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-1/3 py-3 px-4 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 active:scale-95 transition min-h-[46px]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || itemCount === 0}
              className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center space-x-1.5 min-h-[46px] ${
                isStockIn
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 disabled:bg-stone-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 disabled:bg-stone-300'
              }`}
            >
              {isStockIn ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Barang Masuk'}</span>
                </>
              ) : (
                <>
                  <Banknote className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses...' : 'Bayar'}</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
