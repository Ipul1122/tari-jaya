import React, { useState } from 'react';
import type { Product } from '../../db/schema';
import { formatCurrency, formatNumber, isLowStock, isCriticalStock } from '../../utils/formatters';
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Boxes, 
  Layers, 
  GitMerge
} from 'lucide-react';
import { PopoverConfirm } from '../common/PopoverConfirm';

export interface ProductContainerGroup {
  key: string;
  name: string;
  category_id: number;
  total_stock: number;
  items: Product[];
  latest_updated_at: string;
}

interface ProductContainerCardProps {
  container: ProductContainerGroup;
  categoryName?: string;
  onStockIn: (product: Product) => void;
  onStockOut: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onViewDetail?: (product: Product) => void;
  onMerge?: (container: ProductContainerGroup) => Promise<void>;
}

export const ProductContainerCard: React.FC<ProductContainerCardProps> = ({
  container,
  categoryName = 'Umum',
  onStockIn,
  onStockOut,
  onEdit,
  onDelete,
  onViewDetail,
  onMerge,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);
  const [showMergeConfirm, setShowMergeConfirm] = useState<boolean>(false);

  const isMultiple = container.items.length > 1;
  const firstItem = container.items[0];

  const low = isLowStock(container.total_stock);
  const critical = isCriticalStock(container.total_stock);

  // Price ranges
  const minCost = Math.min(...container.items.map((i) => i.cost_price));
  const maxCost = Math.max(...container.items.map((i) => i.cost_price));
  const minSelling = Math.min(...container.items.map((i) => i.selling_price));
  const maxSelling = Math.max(...container.items.map((i) => i.selling_price));

  const formatPriceRange = (min: number, max: number) => {
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  // If single item, render standard single-item card
  if (!isMultiple) {
    const single = firstItem;
    const unitMargin = single.selling_price - single.cost_price;

    return (
      <div
        className={`relative bg-white border rounded-2xl p-3.5 transition-all duration-200 shadow-sm ${
          low
            ? 'border-l-4 border-l-red-500 border-stone-200'
            : 'border-stone-200/90 hover:border-orange-300'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-2">
          <div
            onClick={() => onViewDetail?.(single)}
            className="flex-1 min-w-0 cursor-pointer group"
            title="Klik untuk melihat detail & riwayat pasokan barang"
          >
            <div className="flex items-center space-x-1.5">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug truncate group-hover:text-orange-600 transition">
                {single.name}
              </h3>
              <Boxes className="w-3.5 h-3.5 text-stone-400 group-hover:text-orange-500 transition shrink-0 opacity-0 group-hover:opacity-100" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200 truncate max-w-[120px]">
                {categoryName}
              </span>

              {critical ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                  Kritis: {formatNumber(single.current_stock)} unit
                </span>
              ) : low ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                  Stok Menipis: {formatNumber(single.current_stock)}
                </span>
              ) : (
                <span className="text-[11px] font-mono text-stone-600">
                  Stok: <b className="text-slate-900">{formatNumber(single.current_stock)}</b> unit
                </span>
              )}
            </div>
          </div>

          {/* More Actions Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpenId(menuOpenId === single.id ? null : single.id!)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-slate-900 hover:bg-stone-100 active:scale-95 transition"
              title="Opsi Produk"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpenId === single.id && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpenId(null)} />
                <div className="absolute right-0 top-8 z-30 w-36 rounded-xl bg-white border border-stone-200 shadow-xl py-1 animate-fade-in">
                  <button
                    onClick={() => {
                      setMenuOpenId(null);
                      onViewDetail?.(single);
                    }}
                    className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                  >
                    <Boxes className="w-3.5 h-3.5 text-orange-600" />
                    <span>Detail & Pasokan</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpenId(null);
                      onEdit(single);
                    }}
                    className="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ubah Produk</span>
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpenId(null);
                      setConfirmDeleteProduct(single);
                    }}
                    className="w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-stone-100 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-red-600">Hapus Produk</span>
                  </button>
                </div>
              </>
            )}

            <PopoverConfirm
              isOpen={confirmDeleteProduct?.id === single.id}
              title={`Hapus "${single.name}"?`}
              description="Semua data mutasi barang ini juga akan ikut dihapus dari riwayat transaksi."
              confirmLabel="Ya, Hapus"
              cancelLabel="Batal"
              variant="danger"
              position="top-right"
              onConfirm={() => {
                setConfirmDeleteProduct(null);
                onDelete(single);
              }}
              onCancel={() => setConfirmDeleteProduct(null)}
            />
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-stone-500 block font-medium">Harga Modal</span>
            <span className="font-mono font-medium text-slate-700">
              {formatCurrency(single.cost_price)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-stone-500 block font-medium">Harga Jual</span>
            <span className="font-mono font-bold text-slate-900">
              {formatCurrency(single.selling_price)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-stone-500 block font-medium">Margin/Unit</span>
            <span className={`font-mono font-bold ${unitMargin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {unitMargin >= 0 ? '+' : ''}{formatCurrency(unitMargin)}
            </span>
          </div>
        </div>

        {/* Notes if available */}
        {single.notes && (
          <div className="mt-2 text-[11px] text-stone-600 bg-stone-50 px-2.5 py-1.5 rounded-xl border border-stone-200/70 truncate">
            <span className="font-semibold text-stone-500">Catatan: </span>
            <span>{single.notes}</span>
          </div>
        )}

        {/* Action Buttons: Stock In & Stock Out */}
        <div className="mt-3 pt-2.5 border-t border-stone-100 grid grid-cols-2 gap-2">
          <button
            onClick={() => onStockIn(single)}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 active:scale-[0.98] transition font-bold text-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <span className="text-emerald-700 font-bold">Masuk</span>
          </button>

          <button
            onClick={() => onStockOut(single)}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-300 active:scale-[0.98] transition font-bold text-xs min-h-[44px]"
          >
            <Minus className="w-4 h-4 text-orange-600 stroke-[3]" />
            <span className="text-orange-700 font-bold">Keluar</span>
          </button>
        </div>
      </div>
    );
  }

  // CONTAINER MODE: Multiple items with the same name grouped together!
  return (
    <div
      className={`relative bg-white border-2 rounded-2xl p-4 transition-all duration-200 shadow-sm space-y-3 ${
        low
          ? 'border-l-4 border-l-red-500 border-amber-200/80 bg-amber-50/20'
          : 'border-orange-200/90 bg-orange-50/15 hover:border-orange-300'
      }`}
    >
      {/* Container Header Bar */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug truncate">
              {container.name}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200 shrink-0">
              Container ({container.items.length} Wadah)
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200 truncate">
              {categoryName}
            </span>

            {critical ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                Kritis Total: {formatNumber(container.total_stock)} unit
              </span>
            ) : low ? (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                Stok Menipis Total: {formatNumber(container.total_stock)}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-stone-600">
                Total Stok Kumulatif: <b className="text-slate-900 font-bold text-sm">{formatNumber(container.total_stock)}</b> unit
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Overview */}
      <div className="p-2.5 rounded-xl bg-white border border-stone-200/90 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] text-stone-500 block font-medium">Rentang Harga Modal</span>
          <span className="font-mono font-bold text-slate-800 text-[11px]">
            {formatPriceRange(minCost, maxCost)}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-stone-500 block font-medium">Rentang Harga Jual</span>
          <span className="font-mono font-bold text-slate-900 text-[11px]">
            {formatPriceRange(minSelling, maxSelling)}
          </span>
        </div>
      </div>

      {/* Accordion Toggle Trigger Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2.5 px-3.5 rounded-xl bg-orange-100/70 hover:bg-orange-100 border border-orange-200 text-orange-900 text-xs font-bold flex items-center justify-between active:scale-[0.99] transition shadow-2xs"
      >
        <span className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-orange-600" />
          <span>
            {isExpanded
              ? 'Tutup Rincian Pasokan'
              : `Buka Rincian (${container.items.length} Pasokan Terpisah • Total ${container.total_stock} Unit)`}
          </span>
        </span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-orange-700" />
        ) : (
          <ChevronDown className="w-4 h-4 text-orange-700" />
        )}
      </button>

      {/* Accordion Content Unfolded */}
      {isExpanded && (
        <div className="space-y-2.5 pt-1 border-t border-orange-200/70 animate-fade-in">
          <div className="flex items-center justify-between text-xs px-1 text-stone-600">
            <span className="font-bold text-[11px] text-slate-800 uppercase tracking-wider">
              Rincian Pemisahan Stok ({container.items.length} Wadah):
            </span>
            <span className="text-[10px] text-stone-400">Total: {container.total_stock} unit</span>
          </div>

          {/* Sub-item Cards */}
          <div className="space-y-2">
            {container.items.map((item, idx) => {
              const itemMargin = item.selling_price - item.cost_price;

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs space-y-2 text-xs"
                >
                  {/* Sub-item Top: Batch Tag, Stock, Menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-slate-900 text-xs">
                          Wadah #{idx + 1}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-mono font-medium">
                          {item.name}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center space-x-2 font-mono text-[11px]">
                        <span className="font-bold text-slate-900">
                          Stok: <b className="text-orange-600">{formatNumber(item.current_stock)}</b> unit
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="text-stone-600">
                          Modal: {formatCurrency(item.cost_price)}
                        </span>
                      </div>
                    </div>

                    {/* Sub-item Actions Dropdown */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setMenuOpenId(menuOpenId === item.id ? null : item.id!)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-slate-900 hover:bg-stone-100 transition"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {menuOpenId === item.id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 top-7 z-30 w-36 rounded-xl bg-white border border-stone-200 shadow-xl py-1 animate-fade-in">
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpenId(null);
                                onViewDetail?.(item);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-left text-slate-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                            >
                              <Boxes className="w-3.5 h-3.5 text-orange-600" />
                              <span>Detail Pasokan</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpenId(null);
                                onEdit(item);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-left text-slate-800 hover:bg-stone-50 flex items-center space-x-2 font-medium"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Ubah Data</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpenId(null);
                                setConfirmDeleteProduct(item);
                              }}
                              className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 border-t border-stone-100 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                              <span>Hapus Wadah Ini</span>
                            </button>
                          </div>
                        </>
                      )}

                      <PopoverConfirm
                        isOpen={confirmDeleteProduct?.id === item.id}
                        title={`Hapus wadah #${idx + 1} (${item.name})?`}
                        description="Hanya data wadah ini yang akan dihapus."
                        confirmLabel="Ya, Hapus"
                        cancelLabel="Batal"
                        variant="danger"
                        position="top-right"
                        onConfirm={() => {
                          setConfirmDeleteProduct(null);
                          onDelete(item);
                        }}
                        onCancel={() => setConfirmDeleteProduct(null)}
                      />
                    </div>
                  </div>

                  {/* Why it was split / Catatan info */}
                  {item.notes ? (
                    <div className="p-2 rounded-lg bg-stone-50 border border-stone-200/70 text-[11px] text-stone-700">
                      <b className="text-stone-500 font-semibold block text-[10px]">Alasan / Catatan Pemisahan:</b>
                      <span className="italic font-medium">{item.notes}</span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-stone-400 italic">
                      Tanpa catatan khusus
                    </div>
                  )}

                  {/* Pricing row */}
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100 font-mono">
                    <span className="text-stone-600">
                      Jual: <b className="text-slate-900">{formatCurrency(item.selling_price)}</b>
                    </span>
                    <span className="text-emerald-700 font-bold">
                      Margin: +{formatCurrency(itemMargin)}
                    </span>
                  </div>

                  {/* Quick Action buttons for this specific item */}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onStockIn(item)}
                      className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold text-xs flex items-center justify-center space-x-1 active:scale-95 transition"
                    >
                      <Plus className="w-3 h-3 stroke-[3]" />
                      <span>Masuk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onStockOut(item)}
                      className="py-1.5 px-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-300 font-bold text-xs flex items-center justify-center space-x-1 active:scale-95 transition"
                    >
                      <Minus className="w-3 h-3 stroke-[3]" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Merge Option to Consolidate into 1 Master Product */}
          {onMerge && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowMergeConfirm(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-slate-800 text-xs font-bold flex items-center justify-center space-x-1.5 active:scale-95 transition shadow-2xs"
              >
                <GitMerge className="w-3.5 h-3.5 text-blue-600" />
                <span>Gabungkan Semua Jadi 1 Produk ({container.total_stock} Unit)</span>
              </button>

              <PopoverConfirm
                isOpen={showMergeConfirm}
                title={`Gabungkan ${container.items.length} Wadah "${container.name}"?`}
                description={`Semua stok (${container.total_stock} unit) dan catatan akan disatukan ke dalam 1 produk master tunggal. Data riwayat mutasi tetap aman.`}
                confirmLabel="Ya, Gabungkan"
                cancelLabel="Batal"
                variant="primary"
                position="top-center"
                onConfirm={async () => {
                  setShowMergeConfirm(false);
                  await onMerge(container);
                }}
                onCancel={() => setShowMergeConfirm(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
