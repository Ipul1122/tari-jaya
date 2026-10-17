import React from 'react';
import type { Product } from '../../db/schema';
import { DrawerProductPickerItem } from './DrawerProductPickerItem';
import { Search, X, Plus, PackagePlus } from 'lucide-react';

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
  onOpenAddNewProduct?: (initialName?: string) => void;
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
  onOpenAddNewProduct,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama material, ukuran, atau merek..."
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
          <div className="p-6 text-center bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {searchQuery.trim()
                  ? `Material "${searchQuery.trim()}" belum terdaftar`
                  : 'Katalog material masih kosong'}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {searchQuery.trim()
                  ? 'Daftarkan material ini langsung untuk dimasukkan ke transaksi.'
                  : 'Tambahkan material pertama Anda untuk mulai mencatat transaksi.'}
              </p>
            </div>
            {onOpenAddNewProduct && (
              <button
                type="button"
                onClick={() => onOpenAddNewProduct(searchQuery.trim())}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm active:scale-95 transition min-h-[40px]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>
                  {searchQuery.trim()
                    ? `Daftarkan "${searchQuery.trim()}" Sekarang`
                    : 'Tambah Barang Pertama'}
                </span>
              </button>
            )}
          </div>
        ) : (
          <>
            {filteredProducts.map((p) => (
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
            ))}

            {onOpenAddNewProduct && (
              <button
                type="button"
                onClick={() => onOpenAddNewProduct(searchQuery.trim())}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-stone-300 hover:border-orange-500 text-stone-600 hover:text-orange-600 font-bold text-xs flex items-center justify-center space-x-1.5 bg-white/60 hover:bg-orange-50/50 transition min-h-[44px]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>
                  {searchQuery.trim()
                    ? `Tambah "${searchQuery.trim()}" sebagai barang baru`
                    : 'Tambah barang baru lainnya'}
                </span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
