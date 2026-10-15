import React from 'react';
import type { Product } from '../../db/schema';
import { DrawerProductPickerItem } from './DrawerProductPickerItem';
import { Search, X } from 'lucide-react';

interface DrawerSelectTabProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filteredProducts: Product[];
  isStockIn: boolean;
  cartItemMap: Map<number, number>;
  duplicateNameCountMap: Map<string, number>;
  allowNegative: boolean;
  onAddProduct: (product: Product) => void;
  onDecrementProduct: (productId: number) => void;
  onDirectQuantityChange: (product: Product, value: string) => void;
  onInputBlur: (productId: number) => void;
}

export const DrawerSelectTab: React.FC<DrawerSelectTabProps> = ({
  searchQuery,
  onSearchChange,
  filteredProducts,
  isStockIn,
  cartItemMap,
  duplicateNameCountMap,
  allowNegative,
  onAddProduct,
  onDecrementProduct,
  onDirectQuantityChange,
  onInputBlur,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama barang atau catatan..."
          className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-white border border-stone-300 text-slate-900 text-xs focus:outline-none focus:border-orange-500 min-h-[44px]"
          autoFocus
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            aria-label="Hapus Pencarian"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-400 bg-white rounded-2xl border border-stone-200">
            Tidak ditemukan barang yang cocok dengan pencarian.
          </div>
        ) : (
          filteredProducts.map((p) => (
            <DrawerProductPickerItem
              key={p.id}
              product={p}
              isStockIn={isStockIn}
              qtyInCart={cartItemMap.get(p.id!) || 0}
              isSelected={cartItemMap.has(p.id!)}
              isDuplicate={(duplicateNameCountMap.get(p.name.trim().toLowerCase()) || 0) > 1}
              allowNegative={allowNegative}
              onAdd={onAddProduct}
              onDecrement={onDecrementProduct}
              onDirectQuantityChange={onDirectQuantityChange}
              onBlur={onInputBlur}
            />
          ))
        )}
      </div>
    </div>
  );
};
