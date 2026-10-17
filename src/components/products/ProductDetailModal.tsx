import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../db/schema';
import type { Product, StockMutation } from '../../db/schema';
import { formatCurrency, formatNumber, isLowStock, isCriticalStock } from '../../utils/formatters';
import { DetailMutationCard } from './DetailMutationCard';
import { X, ArrowUpRight, Plus, Minus, Edit2, Truck, History, Boxes, Layers, Sparkles } from 'lucide-react';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onStockIn: (product: Product) => void;
  onStockOut: (product: Product) => void;
  onEdit: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onStockIn,
  onStockOut,
  onEdit,
}) => {
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [activeTab, setActiveTab] = useState<'IN' | 'OUT' | 'ALL'>('IN');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || !product?.id) {
      setMutations([]);
      return;
    }

    const loadMutations = async () => {
      setLoading(true);
      try {
        const data = await db.stock_mutations
          .where('product_id')
          .equals(product.id!)
          .reverse()
          .sortBy('timestamp');
        setMutations(data);
      } catch (err: unknown) {
        console.error('Error loading product mutations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMutations();
  }, [isOpen, product]);

  const inMutations = useMemo(() => mutations.filter((m) => m.type === 'IN'), [mutations]);
  const outMutations = useMemo(() => mutations.filter((m) => m.type === 'OUT'), [mutations]);

  const totalInQty = inMutations.reduce((sum, m) => sum + m.quantity, 0);
  const totalInValue = inMutations.reduce((sum, m) => sum + m.quantity * m.unit_cost, 0);
  const averageCostPrice = totalInQty > 0 ? Math.round(totalInValue / totalInQty) : (product?.cost_price || 0);

  const totalOutQty = outMutations.reduce((sum, m) => sum + m.quantity, 0);
  const totalOutValue = outMutations.reduce((sum, m) => sum + m.quantity * m.unit_price, 0);
  const totalProfit = outMutations.reduce((sum, m) => sum + m.gross_profit, 0);

  if (!isOpen || !product) return null;

  const low = isLowStock(product.current_stock);
  const critical = isCriticalStock(product.current_stock);

  const displayedMutations = 
    activeTab === 'IN' 
      ? inMutations 
      : activeTab === 'OUT' 
      ? outMutations 
      : mutations;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-[#FAF8F5] border border-stone-200 rounded-t-3xl sm:rounded-2xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl animate-slide-up text-slate-900 pb-safe">
        
        {/* Pull Handle for Mobile */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-white sm:rounded-t-2xl shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h2 className="text-sm font-bold text-slate-900 truncate">{product.name}</h2>
              <span className="text-[11px] text-stone-500 font-medium">Detail Riwayat Pasokan & Stok</span>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => {
                onClose();
                onEdit(product);
              }}
              className="p-1.5 rounded-lg text-stone-500 hover:text-blue-600 hover:bg-blue-50 transition"
              title="Ubah Produk"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-500 hover:text-slate-900 hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {/* Main Container Summary Card */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                  Total Sisa Stok Toko
                </span>
                <div className="flex items-baseline space-x-1.5 mt-0.5">
                  <span className="text-2xl font-mono font-bold text-slate-900">
                    {formatNumber(product.current_stock)}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">unit saat ini</span>
                </div>
              </div>

              {critical ? (
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                  Kritis (≤ 3 unit)
                </span>
              ) : low ? (
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                  Menipis (≤ 9 unit)
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Stok Aman
                </span>
              )}
            </div>

            {/* Price & Average Cost Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-stone-100 text-xs">
              <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/80">
                <span className="text-[10px] text-stone-500 block font-medium">Modal Terakhir</span>
                <b className="font-mono text-slate-900 font-bold block mt-0.5">
                  {formatCurrency(product.cost_price)}
                </b>
              </div>

              <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/80">
                <span className="text-[10px] text-stone-500 block font-medium flex items-center space-x-1">
                  <span>HPP Rata-rata</span>
                  <Sparkles className="w-3 h-3 text-orange-500" />
                </span>
                <b className="font-mono text-orange-700 font-bold block mt-0.5">
                  {formatCurrency(averageCostPrice)}
                </b>
              </div>

              <div className="p-2 rounded-xl bg-stone-50 border border-stone-200/80">
                <span className="text-[10px] text-stone-500 block font-medium">Harga Jual</span>
                <b className="font-mono text-emerald-700 font-bold block mt-0.5">
                  {formatCurrency(product.selling_price)}
                </b>
              </div>
            </div>

            {/* Product Note if available */}
            {product.notes && (
              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 text-xs text-amber-900">
                <span className="font-bold block text-[10px] text-amber-700 uppercase tracking-wider mb-0.5">
                  Catatan Master Barang:
                </span>
                <p className="text-[11px] leading-relaxed">{product.notes}</p>
              </div>
            )}

            {/* Quick In & Out Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStockIn(product);
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition min-h-[44px]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Stok Masuk</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStockOut(product);
                }}
                className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition min-h-[44px]"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
                <span>Stok Keluar</span>
              </button>
            </div>
          </div>

          {/* Segmented Filter Tabs */}
          <div className="space-y-2">
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setActiveTab('IN')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 min-h-[36px] ${
                  activeTab === 'IN' ? 'bg-white text-orange-700 shadow-xs' : 'text-stone-600'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Pasokan ({inMutations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('OUT')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 min-h-[36px] ${
                  activeTab === 'OUT' ? 'bg-white text-red-700 shadow-xs' : 'text-stone-600'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Penjualan ({outMutations.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 min-h-[36px] ${
                  activeTab === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-stone-600'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Semua ({mutations.length})</span>
              </button>
            </div>

            {/* Tab Summary Banner */}
            {activeTab === 'IN' && (
              <div className="flex items-center justify-between px-1 text-[11px] text-stone-600">
                <span>Total Pasokan: <b className="font-mono text-slate-900 font-bold">{formatNumber(totalInQty)} unit</b></span>
                <span>Total Modal: <b className="font-mono text-orange-700 font-bold">{formatCurrency(totalInValue)}</b></span>
              </div>
            )}

            {activeTab === 'OUT' && (
              <div className="flex items-center justify-between px-1 text-[11px] text-stone-600">
                <span>Terjual: <b className="font-mono text-slate-900 font-bold">{formatNumber(totalOutQty)} unit</b> ({formatCurrency(totalOutValue)})</span>
                <span>Laba: <b className="font-mono text-emerald-700 font-bold">+{formatCurrency(totalProfit)}</b></span>
              </div>
            )}
          </div>

          {/* Mutations Feed */}
          <div className="space-y-2">
            {loading ? (
              <div className="p-6 text-center text-xs text-stone-500">Memuat riwayat...</div>
            ) : displayedMutations.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center text-stone-500">
                <Layers className="w-8 h-8 text-stone-300 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-slate-800">
                  {activeTab === 'IN'
                    ? 'Belum ada catatan pasokan masuk'
                    : activeTab === 'OUT'
                    ? 'Belum ada catatan penjualan'
                    : 'Belum ada riwayat mutasi'}
                </p>
              </div>
            ) : (
              displayedMutations.map((m) => <DetailMutationCard key={m.id} mutation={m} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
