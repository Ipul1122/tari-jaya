import React, { useState, useMemo } from 'react';
import { useMutations } from '../hooks/useMutations';
import { useProducts } from '../hooks/useProducts';
import { HistoryContainerCard } from '../components/mutations/HistoryContainerCard';
import { VoidConfirmationModal } from '../components/mutations/VoidConfirmationModal';
import { groupHistoryMutations } from '../utils/historyGrouping';
import { voidMutation } from '../db/operations';
import { useToast } from '../components/common/Toast';
import { formatCurrency, formatNumber } from '../utils/formatters';
import type { Product } from '../db/schema';
import type { MutationWithProduct } from '../hooks/useMutations';
import {
  PackagePlus,
  Plus,
  Search,
  X,
  ArrowDownLeft,
  ShoppingBag,
  ArrowRight
} from 'lucide-react';

interface StockInViewProps {
  onOpenStockIn: (product?: Product) => void;
  onNavigateToHistoryIn: () => void;
}

export const StockInView: React.FC<StockInViewProps> = ({
  onOpenStockIn,
  onNavigateToHistoryIn,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const todayStr = new Date().toISOString().slice(0, 10);

  const { mutations, refresh: refreshMutations } = useMutations('IN', todayStr);
  const { products, refresh: refreshProducts } = useProducts(null, searchQuery);

  const inContainers = useMemo(() => {
    return groupHistoryMutations(mutations);
  }, [mutations]);

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  const [voidTargetMutation, setVoidTargetMutation] = useState<MutationWithProduct | null>(null);
  const [isVoiding, setIsVoiding] = useState<boolean>(false);

  const handleRequestVoid = (mutation: MutationWithProduct) => setVoidTargetMutation(mutation);

  const handleConfirmVoid = async () => {
    if (!voidTargetMutation?.id) return;
    setIsVoiding(true);
    try {
      const result = await voidMutation(voidTargetMutation.id);
      showToast(`Pengadaan ${result.productName} berhasil dibatalkan dan stok dikurangi`, 'info');
      setVoidTargetMutation(null);
      refreshMutations();
      refreshProducts();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal membatalkan transaksi', 'error');
    } finally {
      setIsVoiding(false);
    }
  };

  // Metrics for today's stock in
  const totalUnitsInToday = mutations.reduce((acc, m) => acc + m.quantity, 0);
  const totalValueInToday = mutations.reduce((acc, m) => acc + m.quantity * m.unit_cost, 0);

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Top Banner Action */}
      <div className="px-4 pt-4">
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-700/20">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full inline-block">
                3.1 Barang Masuk
              </span>
              <h2 className="text-base font-extrabold mt-1">Penerimaan & Pembelian</h2>
              <p className="text-xs text-emerald-100 mt-0.5">Catat stok masuk dari supplier atau gudang</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <PackagePlus className="w-6 h-6 text-white" />
            </div>
          </div>

          <button
            onClick={() => onOpenStockIn()}
            className="mt-3.5 w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-white text-emerald-800 font-extrabold text-xs shadow-sm hover:bg-emerald-50 active:scale-[0.98] transition min-h-[46px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Catat Barang Masuk Baru (Batch)</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="px-4 mt-3 grid grid-cols-2 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
            Unit Masuk Hari Ini
          </span>
          <div className="text-lg font-black text-emerald-700 mt-1">
            {formatNumber(totalUnitsInToday)} <span className="text-xs font-semibold text-stone-500">unit</span>
          </div>
          <span className="text-[10px] text-stone-400 font-medium">
            {mutations.length} kali pencatatan
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-xs">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
            Belanja Stok Hari Ini
          </span>
          <div className="text-base font-black text-slate-900 mt-1 truncate">
            {formatCurrency(totalValueInToday)}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            Modal pembelian
          </span>
        </div>
      </div>

      {/* Quick Search & Restock Single Product */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pilih Material untuk Tambah Stok
          </h3>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama material untuk tambah cepat (semen, pasir, besi)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-stone-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs min-h-[44px]"
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
                      Stok saat ini: <span className="font-bold text-slate-700">{p.current_stock}</span> • Modal: {formatCurrency(p.cost_price)}
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenStockIn(p)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 active:scale-95 transition shrink-0 min-h-[36px]"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Masuk</span>
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Today's Inflow Transactions List */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>Penerimaan Hari Ini ({inContainers.length} Kontainer Masuk)</span>
          </h3>
          <button
            onClick={onNavigateToHistoryIn}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>Semua Riwayat Masuk</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {inContainers.length === 0 ? (
          <div className="p-7 rounded-3xl bg-white border border-stone-200 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2.5">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-bold text-slate-900">Belum ada barang masuk hari ini</h4>
            <p className="text-[11px] text-stone-500 mt-0.5">
              Klik tombol "Catat Barang Masuk Baru" di atas untuk menambahkan stok masuk.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {inContainers.map((container) => (
              <HistoryContainerCard
                key={container.id}
                container={container}
                isExpanded={expandedMap[container.id] ?? true}
                onToggleExpand={() => toggleExpand(container.id)}
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
