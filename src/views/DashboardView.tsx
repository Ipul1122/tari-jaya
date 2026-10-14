import React from 'react';
import { useReports } from '../hooks/useReports';
import { useLowStock } from '../hooks/useLowStock';
import { useMutations } from '../hooks/useMutations';
import { useProducts } from '../hooks/useProducts';
import { LowStockBanner } from '../components/products/LowStockBanner';
import { MetricCard } from '../components/reports/MetricCard';
import { MutationListItem } from '../components/mutations/MutationListItem';
import { formatCurrency, formatNumber } from '../utils/formatters';
import type { Product } from '../db/schema';
import { voidMutation } from '../db/operations';
import { useToast } from '../components/common/Toast';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Boxes, 
  Plus, 
  Minus,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  onOpenStockIn: (product?: Product) => void;
  onOpenStockOut: (product?: Product) => void;
  onNavigateToTab: (tab: 'catalog' | 'history' | 'reports') => void;
  onSelectProduct: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenStockIn,
  onOpenStockOut,
  onNavigateToTab,
  onSelectProduct,
}) => {
  const { summary, refresh: refreshReports } = useReports('today');
  const { lowStockProducts, refresh: refreshLowStock } = useLowStock();
  const { mutations, refresh: refreshMutations } = useMutations('ALL');
  const { products, refresh: refreshProducts } = useProducts();
  const { showToast } = useToast();

  const handleVoid = async (id: number) => {
    try {
      await voidMutation(id);
      showToast('Transaksi berhasil dibatalkan dan stok dikembalikan', 'info');
      refreshReports();
      refreshLowStock();
      refreshMutations();
      refreshProducts();
    } catch (err: any) {
      showToast(err?.message || 'Gagal membatalkan transaksi', 'error');
    }
  };

  const recentMutations = mutations.slice(0, 4);

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Banner Ringkasan Hari Ini */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>Ringkasan Hari Ini</span>
              <Sparkles className="w-4 h-4 text-orange-500" />
            </h2>
            <p className="text-xs text-stone-500 font-medium">Pencatatan real-time di perangkat Anda</p>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
            {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        {/* 2x2 Metric Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard
            label="Omzet Penjualan"
            value={formatCurrency(summary.totalOutValue)}
            subValue={`${formatNumber(summary.totalOutQty)} unit keluar`}
            icon={<ShoppingBag className="w-4 h-4" />}
            colorScheme="orange"
          />
          <MetricCard
            label="Estimasi Laba Kotor"
            value={formatCurrency(summary.totalGrossProfit)}
            subValue={
              summary.totalOutValue > 0
                ? `${((summary.totalGrossProfit / summary.totalOutValue) * 100).toFixed(0)}% Margin`
                : '0% Margin'
            }
            icon={<TrendingUp className="w-4 h-4" />}
            colorScheme="emerald"
          />
          <MetricCard
            label="Belanja Modal (IN)"
            value={formatCurrency(summary.totalInValue)}
            subValue={`${formatNumber(summary.totalInQty)} unit masuk`}
            icon={<DollarSign className="w-4 h-4" />}
            colorScheme="red"
          />
          <MetricCard
            label="Total Katalog"
            value={`${formatNumber(products.length)} Jenis`}
            subValue="Barang aktif"
            icon={<Boxes className="w-4 h-4" />}
            colorScheme="slate"
          />
        </div>
      </div>

      {/* Low Stock Alert Banner (<= 9 unit) */}
      <LowStockBanner
        lowStockProducts={lowStockProducts}
        onSelectProduct={(p) => {
          onSelectProduct(p);
          onOpenStockIn(p);
        }}
        onNavigateToCatalog={() => onNavigateToTab('catalog')}
      />

      {/* Quick Action Bar (Tombol Pintasan Transaksi) */}
      <div className="px-4 mt-4">
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block mb-2">
            Aksi Cepat Transaksi (Bisa Bulk / Banyak Barang)
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Text Button Add GREEN */}
            <button
              onClick={() => onOpenStockIn()}
              className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.98] transition min-h-[46px]"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
              <span className="text-white font-bold">+ Masuk (Kulakan)</span>
            </button>

            {/* Sub Red for Stock Out */}
            <button
              onClick={() => onOpenStockOut()}
              className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 active:scale-[0.98] transition min-h-[46px]"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Minus className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
              <span className="text-white font-bold">- Keluar (Terjual)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Mutasi Terakhir Hari Ini
          </h3>
          <button
            onClick={() => onNavigateToTab('history')}
            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center space-x-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentMutations.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center shadow-xs">
            <p className="text-xs text-stone-600 font-medium">Belum ada transaksi mutasi hari ini.</p>
            <p className="text-[11px] text-stone-400 mt-1">
              Gunakan tombol "+ Masuk" atau "- Keluar" di atas untuk mulai mencatat.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentMutations.map((m) => (
              <MutationListItem key={m.id} mutation={m} onVoid={handleVoid} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
