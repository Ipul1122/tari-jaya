import React, { useState } from 'react';
import { useLowStock } from '../hooks/useLowStock';
import { useMutations } from '../hooks/useMutations';
import { useProducts } from '../hooks/useProducts';
import { LowStockBanner } from '../components/products/LowStockBanner';
import { MutationListItem } from '../components/mutations/MutationListItem';
import type { Product } from '../db/schema';
import { voidMutation } from '../db/operations';
import { useToast } from '../components/common/Toast';
import { 
  Plus, 
  Minus, 
  ArrowRight, 
  ShoppingBag, 
  ArrowDownLeft, 
  ArrowUpRight 
} from 'lucide-react';

interface DashboardViewProps {
  onOpenStockIn: (product?: Product) => void;
  onOpenStockOut: (product?: Product) => void;
  onNavigateToTab: (tab: 'catalog' | 'history' | 'reports') => void;
  onSelectProduct: (product: Product) => void;
}

type MutationFilterType = 'ALL' | 'IN' | 'OUT';

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenStockIn,
  onOpenStockOut,
  onNavigateToTab,
  onSelectProduct,
}) => {
  const [filterType, setFilterType] = useState<MutationFilterType>('ALL');
  const todayStr = new Date().toISOString().slice(0, 10);

  const { lowStockProducts, refresh: refreshLowStock } = useLowStock();
  const { mutations, refresh: refreshMutations } = useMutations(filterType, todayStr);
  const { refresh: refreshProducts } = useProducts();
  const { showToast } = useToast();

  const handleVoid = async (id: number) => {
    try {
      await voidMutation(id);
      showToast('Transaksi berhasil dibatalkan dan stok dikembalikan', 'info');
      refreshLowStock();
      refreshMutations();
      refreshProducts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membatalkan transaksi';
      showToast(msg, 'error');
    }
  };

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Date Header */}
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block">
              Transaksi Hari Ini
            </span>
            <h2 className="text-sm font-extrabold text-slate-900 mt-0.5">
              {formattedDate}
            </h2>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            Kasir Aktif
          </span>
        </div>
      </div>

      {/* Quick Action Bar (Pencatatan Transaksi Cepat) */}
      <div className="px-4 mt-3">
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-sm">
          <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block mb-2">
            Pencatatan Transaksi
          </span>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Green Stock In */}
            <button
              onClick={() => onOpenStockIn()}
              className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.98] transition min-h-[46px]"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
              <span className="text-white font-bold">+ Pembelian (Masuk)</span>
            </button>

            {/* Red Stock Out */}
            <button
              onClick={() => onOpenStockOut()}
              className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 active:scale-[0.98] transition min-h-[46px]"
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <Minus className="w-3.5 h-3.5 text-white stroke-[3]" />
              </div>
              <span className="text-white font-bold">- Penjualan (Keluar)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Low Stock Alert Banner (<= 9 unit) */}
      <div className="mt-3">
        <LowStockBanner
          lowStockProducts={lowStockProducts}
          onSelectProduct={(p) => {
            onSelectProduct(p);
            onOpenStockIn(p);
          }}
          onNavigateToCatalog={() => onNavigateToTab('catalog')}
        />
      </div>

      {/* Transacted Items Section */}
      <div className="px-4 mt-3">
        {/* Header & Filter Tabs */}
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Barang Ditransaksikan
          </h3>
          <button
            onClick={() => onNavigateToTab('history')}
            className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center space-x-1"
          >
            <span>Semua Riwayat</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Filter Tabs: Semua | Pembelian | Penjualan */}
        <div className="flex bg-stone-100 p-1 rounded-xl mb-3">
          <button
            onClick={() => setFilterType('ALL')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
              filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-stone-500'
            }`}
          >
            Semua ({mutations.length})
          </button>
          <button
            onClick={() => setFilterType('IN')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              filterType === 'IN' ? 'bg-white text-emerald-700 shadow-xs' : 'text-stone-500'
            }`}
          >
            <ArrowDownLeft className="w-3 h-3" />
            <span>Pembelian</span>
          </button>
          <button
            onClick={() => setFilterType('OUT')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
              filterType === 'OUT' ? 'bg-white text-red-700 shadow-xs' : 'text-stone-500'
            }`}
          >
            <ArrowUpRight className="w-3 h-3" />
            <span>Penjualan</span>
          </button>
        </div>

        {/* List of Today's Transactions */}
        {mutations.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Belum ada barang ditransaksikan</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-[260px] mx-auto">
              {filterType === 'IN'
                ? 'Belum ada pembelian barang (stok masuk) hari ini.'
                : filterType === 'OUT'
                  ? 'Belum ada penjualan barang (stok keluar) hari ini.'
                  : 'Gunakan tombol "+ Pembelian" atau "- Penjualan" di atas untuk mencatat barang.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {mutations.map((m) => (
              <MutationListItem key={m.id} mutation={m} onVoid={handleVoid} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
