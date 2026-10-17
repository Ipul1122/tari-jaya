import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ArrowRight, PackageX } from 'lucide-react';
import type { Product } from '../../db/schema';
import { formatNumber } from '../../utils/formatters';

interface LowStockBannerProps {
  lowStockProducts: Product[];
  onSelectProduct?: (product: Product) => void;
  onNavigateToCatalog?: () => void;
}

export const LowStockBanner: React.FC<LowStockBannerProps> = ({
  lowStockProducts,
  onSelectProduct,
  onNavigateToCatalog,
}) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const count = lowStockProducts.length;

  if (count === 0) return null;

  return (
    <div className="mx-4 mt-3 rounded-2xl bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border border-red-200 p-3.5 shadow-sm animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
                Peringatan Stok Kritis
              </span>
              <span className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {count} Material
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5">
              Stok ≤ 9 unit. Segera lakukan kulakan atau restock material.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 text-stone-500 hover:text-slate-900 rounded-lg active:bg-black/5 transition"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-red-200/80 space-y-2">
          {lowStockProducts.slice(0, 5).map(prod => (
            <div
              key={prod.id}
              onClick={() => onSelectProduct?.(prod)}
              className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-orange-50/50 border border-red-100 cursor-pointer active:scale-[0.99] transition shadow-xs"
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <PackageX className="w-4 h-4 text-red-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900 truncate">{prod.name}</span>
              </div>
              <div className="flex items-center space-x-2 shrink-0">
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                  prod.current_stock <= 3 
                    ? 'bg-red-100 text-red-800 border border-red-200' 
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  Sisa {formatNumber(prod.current_stock)}
                </span>
                <span className="text-[11px] text-orange-600 font-bold underline">
                  Restock
                </span>
              </div>
            </div>
          ))}

          {count > 5 && (
            <p className="text-[11px] text-stone-500 text-center pt-1 font-medium">
              + {count - 5} barang kritis lainnya
            </p>
          )}

          {onNavigateToCatalog && (
            <button
              onClick={onNavigateToCatalog}
              className="w-full mt-1 py-2 text-xs font-bold text-red-700 hover:text-red-800 flex items-center justify-center space-x-1.5 rounded-xl bg-red-100/70 border border-red-200 active:bg-red-200"
            >
              <span>Lihat Semua di Katalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
