import React from 'react';
import type { Product } from '../../db/schema';
import { AlertTriangle, Plus } from 'lucide-react';

interface DuplicateProductNoticeProps {
  duplicateProduct: Product;
  onClose: () => void;
  onOpenStockInForExisting?: (product: Product) => void;
}

export const DuplicateProductNotice: React.FC<DuplicateProductNoticeProps> = ({
  duplicateProduct,
  onClose,
  onOpenStockInForExisting,
}) => {
  return (
    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2.5">
      <div className="flex items-start space-x-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <b className="font-bold">Material "{duplicateProduct.name}" sudah ada di katalog!</b>
          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
            Sisa stok saat ini: <b>{duplicateProduct.current_stock} unit</b>.
            Untuk material yang sama, disarankan cukup mencatat <b>Stok Masuk</b> agar stok terakumulasi rapi.
          </p>
        </div>
      </div>

      {onOpenStockInForExisting && (
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenStockInForExisting(duplicateProduct);
          }}
          className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-98 transition min-h-[44px]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Catat Stok Masuk untuk Material Ini</span>
        </button>
      )}
    </div>
  );
};
