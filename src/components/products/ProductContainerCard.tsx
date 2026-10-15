import React, { useState } from 'react';
import type { Product } from '../../db/schema';
import { formatCurrency, isLowStock } from '../../utils/formatters';
import { ChevronDown, ChevronUp, Boxes, Layers, GitMerge } from 'lucide-react';
import { PopoverConfirm } from '../common/PopoverConfirm';
import { ProductVariantRow } from './ProductVariantRow';
import { SingleProductCard } from './SingleProductCard';

export interface ProductContainerGroup {
  key: string;
  name: string;
  category_id?: number;
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
  onStockIn,
  onStockOut,
  onEdit,
  onDelete,
  onViewDetail,
  onMerge,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [showMergeConfirm, setShowMergeConfirm] = useState<boolean>(false);

  const isMultiple = container.items.length > 1;

  // Single item delegation
  if (!isMultiple) {
    return (
      <SingleProductCard
        product={container.items[0]}
        onStockIn={onStockIn}
        onStockOut={onStockOut}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewDetail={onViewDetail}
      />
    );
  }

  const low = isLowStock(container.total_stock);

  // Price ranges
  const minCost = Math.min(...container.items.map((i) => i.cost_price));
  const maxCost = Math.max(...container.items.map((i) => i.cost_price));
  const minSelling = Math.min(...container.items.map((i) => i.selling_price));
  const maxSelling = Math.max(...container.items.map((i) => i.selling_price));

  const formatPriceRange = (min: number, max: number) => {
    if (min === max) return formatCurrency(min);
    return `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  return (
    <div className={`relative bg-amber-50/30 border-2 rounded-2xl p-3.5 transition-all duration-200 shadow-sm space-y-3 ${
      low ? 'border-red-400' : 'border-orange-200 hover:border-orange-300'
    }`}>
      {/* Container Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-orange-100 text-orange-700 shrink-0">
              <Boxes className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 truncate">
              {container.name}
            </h3>
          </div>
          <p className="text-[11px] text-stone-500 font-medium mt-1">
            {container.items.length} wadah pasokan terpisah
          </p>
        </div>

        {/* Merge Button */}
        {onMerge && (
          <button
            type="button"
            onClick={() => setShowMergeConfirm(true)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-orange-300 text-orange-800 text-[11px] font-bold flex items-center space-x-1 active:scale-95 transition shrink-0 min-h-[36px]"
          >
            <GitMerge className="w-3.5 h-3.5 text-orange-600" />
            <span>Satukan Wadah</span>
          </button>
        )}

        <PopoverConfirm
          isOpen={showMergeConfirm}
          title={`Satukan semua wadah "${container.name}"?`}
          description={`Semua ${container.items.length} wadah akan digabungkan menjadi 1 produk dengan total ${container.total_stock} unit.`}
          confirmLabel="Ya, Satukan"
          cancelLabel="Batal"
          variant="warning"
          position="top-right"
          onConfirm={async () => {
            setShowMergeConfirm(false);
            await onMerge?.(container);
          }}
          onCancel={() => setShowMergeConfirm(false)}
        />
      </div>

      {/* Aggregate Stats */}
      <div className="p-2.5 rounded-xl bg-white/90 border border-orange-100 grid grid-cols-2 gap-2 text-xs font-mono">
        <div>
          <span className="text-[10px] text-stone-400 block font-sans">Rentang Modal:</span>
          <span className="font-bold text-slate-800 text-xs">{formatPriceRange(minCost, maxCost)}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-stone-400 block font-sans">Rentang Jual:</span>
          <span className="font-bold text-slate-800 text-xs">{formatPriceRange(minSelling, maxSelling)}</span>
        </div>
      </div>

      {/* Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full py-2.5 px-3.5 rounded-xl bg-orange-100/70 hover:bg-orange-100 border border-orange-200 text-orange-900 text-xs font-bold flex items-center justify-between active:scale-[0.99] transition min-h-[44px]"
      >
        <span className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-orange-600" />
          <span>
            {isExpanded ? 'Tutup Rincian Pasokan' : `Buka Rincian (${container.items.length} Pasokan • Total ${container.total_stock} Unit)`}
          </span>
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-orange-700" /> : <ChevronDown className="w-4 h-4 text-orange-700" />}
      </button>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="space-y-2 pt-1 border-t border-orange-200/70">
          {container.items.map((item, idx) => (
            <ProductVariantRow
              key={item.id}
              item={item}
              index={idx}
              onStockIn={onStockIn}
              onStockOut={onStockOut}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetail={onViewDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
};
