import React, { useState, useMemo } from 'react';
import { useMutations } from '../hooks/useMutations';
import { useProducts } from '../hooks/useProducts';
import { CustomerSalesContainerCard } from '../components/mutations/CustomerSalesContainerCard';
import { VoidConfirmationModal } from '../components/mutations/VoidConfirmationModal';
import { groupMutationsByCustomer } from '../utils/customerGrouping';
import { voidMutation } from '../db/operations';
import { useToast } from '../components/common/Toast';
import { formatCurrency, formatNumber } from '../utils/formatters';
import type { Product } from '../db/schema';
import type { MutationWithProduct } from '../hooks/useMutations';
import {
  PackageMinus,
  Minus,
  Search,
  X,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  Users
} from 'lucide-react';

interface StockOutViewProps {
  onOpenStockOut: (product?: Product) => void;
  onNavigateToHistoryOut: () => void;
}

export const StockOutView: React.FC<StockOutViewProps> = ({
  onOpenStockOut,
  onNavigateToHistoryOut,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const todayStr = new Date().toISOString().slice(0, 10);

  const { mutations, refresh: refreshMutations } = useMutations('OUT', todayStr);
  const { products, refresh: refreshProducts } = useProducts(null, searchQuery);

  const [voidTargetMutation, setVoidTargetMutation] = useState<MutationWithProduct | null>(null);
  const [isVoiding, setIsVoiding] = useState<boolean>(false);

  const handleRequestVoid = (mutation: MutationWithProduct) => setVoidTargetMutation(mutation);

  const handleConfirmVoid = async () => {
    if (!voidTargetMutation?.id) return;
    setIsVoiding(true);
    try {
      const result = await voidMutation(voidTargetMutation.id);
      const msg = result.cancelledDebt
        ? `Transaksi dibatalkan, stok dikembalikan, dan kasbon ${result.cancelledDebt.personName} dihapus dari Buku Piutang`
        : `Transaksi ${result.productName} berhasil dibatalkan dan stok dikembalikan`;
      showToast(msg, 'info');
      setVoidTargetMutation(null);
      refreshMutations();
      refreshProducts();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal membatalkan transaksi', 'error');
    } finally {
      setIsVoiding(false);
    }
  };

  // Group mutations by customer container
  const customerContainers = useMemo(() => {
    return groupMutationsByCustomer(mutations);
  }, [mutations]);

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  // Metrics for today's stock out
  const totalUnitsOutToday = mutations.reduce((acc, m) => acc + m.quantity, 0);
  const totalRevenueToday = mutations.reduce((acc, m) => acc + m.quantity * m.unit_price, 0);
  const totalProfitToday = mutations.reduce((acc, m) => acc + m.gross_profit, 0);

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Top Banner Action */}
      <div className="px-4 pt-4">
        <div className="p-4 rounded-3xl bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-lg shadow-rose-700/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block">
                3.2 Barang Keluar
              </span>
              <h2 className="text-base font-extrabold mt-1">Penjualan & Kasir</h2>
              <p className="text-xs text-rose-100 mt-0.5">Catat penjualan barang dan pengurangan stok</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <PackageMinus className="w-6 h-6 text-white" />
            </div>
          </div>

          <button
            onClick={() => onOpenStockOut()}
            className="mt-3.5 w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-white text-rose-800 font-extrabold text-xs shadow-sm hover:bg-rose-50 active:scale-[0.98] transition min-h-[46px]"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
            <span>Catat Penjualan Baru (Kasir / Batch)</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="px-4 mt-3 grid grid-cols-3 gap-2">
        <div className="p-3 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block">
            Unit Terjual
          </span>
          <div className="text-base font-black text-rose-700 mt-1">
            {formatNumber(totalUnitsOutToday)}
          </div>
          <span className="text-[9px] text-stone-400 font-medium">unit hari ini</span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
          <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider block">
            Omzet Hari Ini
          </span>
          <div className="text-xs font-black text-slate-900 mt-1 truncate">
            {formatCurrency(totalRevenueToday)}
          </div>
          <span className="text-[9px] text-stone-400 font-medium">pendapatan</span>
        </div>

        <div className="p-3 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
          <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" />
            <span>Laba Kotor</span>
          </span>
          <div className="text-xs font-black text-emerald-800 mt-1 truncate">
            {formatCurrency(totalProfitToday)}
          </div>
          <span className="text-[9px] text-emerald-600 font-medium">margin untung</span>
        </div>
      </div>

      {/* Quick Search & Fast Sale */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pilih Material untuk Penjualan Cepat
          </h3>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama material yang terjual (semen, cat, pipa)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              aria-label="Bersihkan"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {searchQuery.trim().length > 0 && (
          <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto rounded-2xl bg-white border border-stone-200 p-2 shadow-xs">
            {products.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-3">Barang tidak ditemukan</p>
            ) : (
              products.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-stone-50 transition border border-stone-100"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-stone-500">
                      Sisa stok: <span className={`font-bold ${p.current_stock <= 0 ? 'text-red-600' : 'text-slate-700'}`}>{p.current_stock}</span> • Jual: {formatCurrency(p.selling_price)}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenStockOut(p)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 active:scale-95 transition shrink-0 min-h-[36px]"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Jual</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Today's Outflow Transactions List Grouped by Customer Container */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <Users className="w-4 h-4 text-rose-600" />
            <span>Penjualan per Pelanggan ({customerContainers.length} Pelanggan)</span>
          </h3>
          <button
            onClick={onNavigateToHistoryOut}
            className="text-[11px] font-bold text-rose-700 hover:text-rose-800 flex items-center space-x-1"
          >
            <span>Semua Riwayat Keluar</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {customerContainers.length === 0 ? (
          <div className="p-7 rounded-3xl bg-white border border-stone-200 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2.5">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Belum ada barang keluar hari ini</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Klik tombol "Catat Penjualan Baru" di atas untuk mencatat barang yang keluar.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {customerContainers.map((container) => (
              <CustomerSalesContainerCard
                key={container.customerKey}
                container={container}
                isExpanded={expandedMap[container.customerKey] ?? true}
                onToggleExpand={() => toggleExpand(container.customerKey)}
                onVoidMutation={handleRequestVoid}
              />
            ))}
          </div>
        )}
      </div>

      <VoidConfirmationModal
        isOpen={!!voidTargetMutation}
        onClose={() => setVoidTargetMutation(null)}
        onConfirm={handleConfirmVoid}
        mutation={voidTargetMutation}
        isSubmitting={isVoiding}
      />
    </div>
  );
};
