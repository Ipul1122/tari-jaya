import React, { useState, useMemo } from 'react';
import { useLowStock } from '../hooks/useLowStock';
import { useMutations } from '../hooks/useMutations';
import { useProducts } from '../hooks/useProducts';
import { LowStockBanner } from '../components/products/LowStockBanner';
import { MutationListItem } from '../components/mutations/MutationListItem';
import { CustomerSalesContainerCard } from '../components/mutations/CustomerSalesContainerCard';
import { VoidConfirmationModal } from '../components/mutations/VoidConfirmationModal';
import { Pagination } from '../components/common/Pagination';
import { groupMutationsByCustomer } from '../utils/customerGrouping';
import type { Product } from '../db/schema';
import type { MutationWithProduct } from '../hooks/useMutations';
import { voidMutation } from '../db/operations';
import { useToast } from '../components/common/Toast';
import type { ReceiptData } from '../types/receipt';
import { buildReceiptFromCustomerContainer, buildReceiptFromMutation } from '../utils/receiptGenerator';
import { Plus, Minus, ArrowRight, ShoppingBag, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

interface DashboardViewProps {
  onOpenStockIn: (product?: Product) => void;
  onOpenStockOut: (product?: Product) => void;
  onNavigateToTab: (tab: 'catalog' | 'history' | 'reports') => void;
  onSelectProduct: (product: Product) => void;
  onOpenAddProduct?: (initialName?: string) => void;
  onViewReceipt?: (receipt: ReceiptData) => void;
  productsCount?: number;
}

type MutationFilterType = 'ALL' | 'IN' | 'OUT';

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenStockIn,
  onOpenStockOut,
  onNavigateToTab,
  onSelectProduct,
  onOpenAddProduct,
  onViewReceipt,
  productsCount = 0,
}) => {
  const [filterType, setFilterType] = useState<MutationFilterType>('ALL');
  const todayStr = new Date().toISOString().slice(0, 10);

  const { lowStockProducts, refresh: refreshLowStock } = useLowStock();
  const { mutations, refresh: refreshMutations } = useMutations(filterType, todayStr);
  const { refresh: refreshProducts } = useProducts();
  const { showToast } = useToast();

  const customerContainers = useMemo(() => {
    if (filterType !== 'OUT') return [];
    return groupMutationsByCustomer(mutations);
  }, [filterType, mutations]);

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const toggleExpand = (key: string) => setExpandedMap((prev) => ({ ...prev, [key]: prev[key] === undefined ? false : !prev[key] }));

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const isOut = filterType === 'OUT';
  const totalItems = isOut ? customerContainers.length : mutations.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pagedContainers = useMemo(() => customerContainers.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage), [customerContainers, safePage, itemsPerPage]);
  const pagedMutations = useMemo(() => mutations.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage), [mutations, safePage, itemsPerPage]);

  const [voidTargetMutation, setVoidTargetMutation] = useState<MutationWithProduct | null>(null);
  const [isVoiding, setIsVoiding] = useState<boolean>(false);
  const handleRequestVoid = (mutation: MutationWithProduct) => setVoidTargetMutation(mutation);

  const handleConfirmVoid = async () => {
    if (!voidTargetMutation?.id) return;
    setIsVoiding(true);
    try {
      const result = await voidMutation(voidTargetMutation.id);
      const msg = result.cancelledDebt
        ? `Transaksi dibatalkan & kasbon ${result.cancelledDebt.personName} dihapus dari Buku Piutang`
        : `Transaksi ${result.productName} berhasil dibatalkan dan stok dikembalikan`;
      showToast(msg, 'info');
      setVoidTargetMutation(null);
      refreshLowStock();
      refreshMutations();
      refreshProducts();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal membatalkan transaksi', 'error');
    } finally {
      setIsVoiding(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Pencatatan Transaksi
            </span>
            {onOpenAddProduct && (
              <button
                type="button"
                onClick={() => onOpenAddProduct('')}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Barang Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button onClick={() => productsCount === 0 && onOpenAddProduct ? onOpenAddProduct('') : onOpenStockIn()} className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 active:scale-[0.98] transition min-h-[46px]">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><Plus className="w-3.5 h-3.5 text-white stroke-[3]" /></div>
              <span className="text-white font-bold">Pembelian (Masuk)</span>
            </button>
            <button onClick={() => productsCount === 0 && onOpenAddProduct ? onOpenAddProduct('') : onOpenStockOut()} className="flex items-center justify-center space-x-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-[0.98] transition min-h-[46px]">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><Minus className="w-3.5 h-3.5 text-white stroke-[3]" /></div>
              <span className="text-white font-bold">Penjualan (Keluar)</span>
            </button>
          </div>

          {productsCount === 0 && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-amber-900 font-medium">Belum ada material di toko. Daftarkan material untuk mulai transaksi.</span>
              {onOpenAddProduct && (
                <button type="button" onClick={() => onOpenAddProduct('')} className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 ml-2 shadow-2xs active:scale-95 transition">
                  Tambah
                </button>
              )}
            </div>
          )}
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
          <button onClick={() => { setCurrentPage(1); setFilterType('ALL'); }} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-stone-500'}`}>
            Semua ({mutations.length})
          </button>
          <button onClick={() => { setCurrentPage(1); setFilterType('IN'); }} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${filterType === 'IN' ? 'bg-white text-emerald-700 shadow-xs' : 'text-stone-500'}`}>
            <ArrowDownLeft className="w-3 h-3" />
            <span>Pembelian</span>
          </button>
          <button onClick={() => { setCurrentPage(1); setFilterType('OUT'); }} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${filterType === 'OUT' ? 'bg-white text-red-700 shadow-xs' : 'text-stone-500'}`}>
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
            <h4 className="text-sm font-bold text-slate-900">{productsCount === 0 ? 'Katalog Material Masih Kosong' : 'Belum ada transaksi material'}</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-[260px] mx-auto">
              {productsCount === 0
                ? 'Tambahkan material pertama Anda langsung dari dashboard untuk mulai mencatat transaksi.'
                : filterType === 'IN' ? 'Belum ada pembelian material (stok masuk) hari ini.'
                  : filterType === 'OUT' ? 'Belum ada penjualan material (stok keluar) hari ini.'
                  : 'Gunakan tombol "Pembelian" atau "Penjualan" di atas untuk mencatat material.'}
            </p>
            {productsCount === 0 && onOpenAddProduct && (
              <button type="button" onClick={() => onOpenAddProduct('')} className="mt-3.5 inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition min-h-[42px]">
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Tambah Material Pertama</span>
              </button>
            )}
          </div>
        ) : filterType === 'OUT' ? (
          <div className="space-y-2.5">
            {pagedContainers.map((container) => (
              <CustomerSalesContainerCard
                key={container.customerKey}
                container={container}
                isExpanded={expandedMap[container.customerKey] ?? true}
                onToggleExpand={() => toggleExpand(container.customerKey)}
                onVoidMutation={handleRequestVoid}
                onViewReceipt={(c) => onViewReceipt?.(buildReceiptFromCustomerContainer(c))}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {pagedMutations.map((m) => (
              <MutationListItem
                key={m.id}
                mutation={m}
                onVoid={async () => handleRequestVoid(m)}
                onViewReceipt={(item) => onViewReceipt?.(buildReceiptFromMutation(item))}
              />
            ))}
          </div>
        )}

        {totalItems > 0 && (
          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName={isOut ? 'pelanggan' : 'transaksi'}
            itemsPerPageOptions={[5, 10, 20]}
          />
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
