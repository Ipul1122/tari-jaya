import React from 'react';
import type { ProductSortOption } from '../../hooks/useProductContainers';
import { Search, Plus, X, ArrowUpDown } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

interface CatalogSearchBarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onOpenAddModal: () => void;
  totalContainers: number;
  startIndex: number;
  endIndex: number;
  sortBy: ProductSortOption;
  onSortChange: (value: ProductSortOption) => void;
}

export const CatalogSearchBar: React.FC<CatalogSearchBarProps> = ({
  searchInput,
  onSearchChange,
  onClearSearch,
  onOpenAddModal,
  totalContainers,
  startIndex,
  endIndex,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 pt-3 pb-2 border-b border-stone-200 shadow-xs space-y-2">
      <div className="flex items-center gap-2">
        {/* Main Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama barang atau catatan..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-slate-900 placeholder-stone-400 text-xs focus:outline-none focus:border-orange-500 transition font-medium min-h-[44px]"
          />
          {searchInput && (
            <button
              onClick={onClearSearch}
              aria-label="Hapus Pencarian"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-slate-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Add Product Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center space-x-1.5 py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="font-bold">Tambah</span>
        </button>
      </div>

      {/* Sub-bar: Counter & Sort Options */}
      <div className="flex items-center justify-between pt-1 text-xs">
        <span className="text-[11px] font-medium text-stone-500">
          {totalContainers > 0 ? (
            <>
              <b className="text-slate-900 font-bold font-mono">
                {formatNumber(startIndex + 1)}-{formatNumber(endIndex)}
              </b>{' '}
              dari <b className="text-slate-900 font-bold font-mono">{formatNumber(totalContainers)}</b> barang
            </>
          ) : (
            '0 barang'
          )}
        </span>

        {/* Sort Selector */}
        <div className="flex items-center space-x-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
            className="py-1 px-2 rounded-lg bg-stone-50 border border-stone-200 text-stone-700 font-medium text-[11px] focus:outline-none focus:border-orange-500"
          >
            <option value="latest">Terbaru</option>
            <option value="name_asc">Nama (A - Z)</option>
            <option value="name_desc">Nama (Z - A)</option>
            <option value="stock_asc">Stok Sedikit</option>
            <option value="stock_desc">Stok Terbanyak</option>
            <option value="price_asc">Harga Termurah</option>
            <option value="price_desc">Harga Termahal</option>
          </select>
        </div>
      </div>
    </div>
  );
};
