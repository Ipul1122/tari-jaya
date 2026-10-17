import React, { useState, useMemo } from 'react';
import { useMutations } from '../hooks/useMutations';
import { MutationListItem } from '../components/mutations/MutationListItem';
import { HistoryContainerCard } from '../components/mutations/HistoryContainerCard';
import { VoidConfirmationModal } from '../components/mutations/VoidConfirmationModal';
import { groupHistoryMutations } from '../utils/historyGrouping';
import type { MutationWithProduct } from '../hooks/useMutations';
import type { ReceiptData } from '../types/receipt';
import { buildReceiptFromHistoryContainer, buildReceiptFromMutation } from '../utils/receiptGenerator';
import { Pagination } from '../components/common/Pagination';
import { voidMutation } from '../db/operations';
import { useToast } from '../components/common/Toast';
import { formatCurrency } from '../utils/formatters';
import { ArrowDownRight, ArrowUpRight, Layers, X, FolderOpen, ListFilter } from 'lucide-react';

interface HistoryViewProps {
  unreadMutationIds?: Set<number>;
  onMarkMutationAsRead?: (id: number) => void;
  onMarkAllAsRead?: () => void;
  initialFilterType?: 'ALL' | 'IN' | 'OUT';
  lockedFilterType?: 'ALL' | 'IN' | 'OUT';
  onViewReceipt?: (receipt: ReceiptData) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  unreadMutationIds,
  onMarkMutationAsRead,
  onMarkAllAsRead,
  initialFilterType = 'ALL',
  lockedFilterType,
  onViewReceipt,
}) => {
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>(lockedFilterType || initialFilterType);
  const [filterDate, setFilterDate] = useState<string>('');

  React.useEffect(() => {
    if (lockedFilterType) setFilterType(lockedFilterType);
  }, [lockedFilterType]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);
  const [viewMode, setViewMode] = useState<'CONTAINER' | 'LIST'>('CONTAINER');

  const { mutations, refresh: refreshMutations } = useMutations(filterType, filterDate);
  const historyContainers = useMemo(() => groupHistoryMutations(mutations), [mutations]);

  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const toggleExpand = (id: string) => setExpandedMap((prev) => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));

  const totalInValue = useMemo(() => mutations.filter((m) => m.type === 'IN').reduce((sum, m) => sum + m.quantity * m.unit_cost, 0), [mutations]);
  const totalOutValue = useMemo(() => mutations.filter((m) => m.type === 'OUT').reduce((sum, m) => sum + m.quantity * m.unit_price, 0), [mutations]);
  const totalProfit = useMemo(() => mutations.filter((m) => m.type === 'OUT').reduce((sum, m) => sum + m.gross_profit, 0), [mutations]);

  const totalContainers = historyContainers.length;
  const totalContainerPages = Math.max(1, Math.ceil(totalContainers / itemsPerPage));
  const safeContainerPage = Math.min(currentPage, totalContainerPages);
  const paginatedContainers = useMemo(() => {
    const start = (safeContainerPage - 1) * itemsPerPage;
    return historyContainers.slice(start, start + itemsPerPage);
  }, [historyContainers, safeContainerPage, itemsPerPage]);

  const totalPages = Math.ceil(mutations.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedMutations = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return mutations.slice(start, start + itemsPerPage);
  }, [mutations, safeCurrentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, filterType, filterDate]);

  const [voidTargetMutation, setVoidTargetMutation] = useState<MutationWithProduct | null>(null);
  const [isVoiding, setIsVoiding] = useState<boolean>(false);

  const handleRequestVoid = (mutation: MutationWithProduct) => setVoidTargetMutation(mutation);

  const handleConfirmVoid = async () => {
    if (!voidTargetMutation?.id) return;
    setIsVoiding(true);
    try {
      const result = await voidMutation(voidTargetMutation.id);
      showToast(result.cancelledDebt ? `Transaksi & kasbon ${result.cancelledDebt.personName} dibatalkan` : `Transaksi ${result.productName} berhasil dibatalkan`, 'info');
      setVoidTargetMutation(null);
      refreshMutations();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal membatalkan transaksi', 'error');
    } finally {
      setIsVoiding(false);
    }
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      <div className="p-4 bg-white border-b border-stone-200/90 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-stone-100 p-1 rounded-xl flex-1 max-w-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition min-h-[34px] ${filterType === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-stone-500'}`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('IN')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1 min-h-[34px] ${filterType === 'IN' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-emerald-700'}`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
            <button
              onClick={() => setFilterType('OUT')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1 min-h-[34px] ${filterType === 'OUT' ? 'bg-red-600 text-white font-bold shadow-xs' : 'text-red-600'}`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 text-slate-900 text-xs rounded-xl focus:outline-none focus:border-orange-500 font-mono min-h-[34px]"
            />
            {filterDate && (
              <button onClick={() => setFilterDate('')} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-slate-900" title="Hapus filter">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
          <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] text-stone-500 block font-sans font-medium">Total Masuk</span>
            <b className="text-orange-600 font-bold">{formatCurrency(totalInValue)}</b>
          </div>
          <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] text-stone-500 block font-sans font-medium">Total Omzet</span>
            <b className="text-red-600 font-bold">{formatCurrency(totalOutValue)}</b>
          </div>
          <div className="p-2 rounded-xl bg-stone-50 border border-stone-200">
            <span className="text-[10px] text-stone-500 block font-sans font-medium">Total Laba</span>
            <b className="text-emerald-700 font-bold">+{formatCurrency(totalProfit)}</b>
          </div>
        </div>
      </div>

      <div className="px-4 mt-3 space-y-2.5">
        {unreadMutationIds && unreadMutationIds.size > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-2.5 flex items-center justify-between text-xs animate-fade-in shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping" />
              <span className="font-bold text-orange-950 text-xs">{unreadMutationIds.size} transaksi baru saja dilakukan</span>
            </div>
            <button type="button" onClick={onMarkAllAsRead} className="px-2.5 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] shadow-xs active:scale-95 transition">
              Tandai Terbaca
            </button>
          </div>
        )}

        {mutations.length > 0 && (
          <div className="flex bg-stone-100 p-1 rounded-xl mb-2">
            <button
              type="button"
              onClick={() => setViewMode('CONTAINER')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${viewMode === 'CONTAINER' ? 'bg-white text-orange-700 shadow-xs' : 'text-stone-500'}`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Kontainer Transaksi ({historyContainers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('LIST')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 ${viewMode === 'LIST' ? 'bg-white text-slate-800 shadow-xs' : 'text-stone-500'}`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Daftar Satuan ({mutations.length})</span>
            </button>
          </div>
        )}

        {mutations.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center my-6 shadow-xs">
            <Layers className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Belum ada riwayat mutasi</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              {filterDate || filterType !== 'ALL' ? 'Tidak ada transaksi yang cocok dengan filter.' : 'Catat barang masuk atau keluar untuk melihat jejak audit.'}
            </p>
          </div>
        ) : viewMode === 'CONTAINER' ? (
          <>
            <div className="space-y-2.5">
              {paginatedContainers.map((container) => (
                <HistoryContainerCard
                  key={container.id}
                  container={container}
                  isExpanded={expandedMap[container.id] ?? true}
                  onToggleExpand={() => toggleExpand(container.id)}
                  onVoidMutation={handleRequestVoid}
                  onViewReceipt={(c) => onViewReceipt?.(buildReceiptFromHistoryContainer(c))}
                />
              ))}
            </div>
            {totalContainers > 0 && (
              <Pagination
                currentPage={safeContainerPage}
                totalPages={totalContainerPages}
                totalItems={totalContainers}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemName="kontainer"
                itemsPerPageOptions={[5, 10, 20]}
              />
            )}
          </>
        ) : (
          <>
            {paginatedMutations.map((m) => (
              <MutationListItem 
                key={m.id} 
                mutation={m} 
                onVoid={async () => handleRequestVoid(m)}
                isUnread={unreadMutationIds?.has(m.id!)}
                onMarkAsRead={onMarkMutationAsRead}
                onViewReceipt={(item) => onViewReceipt?.(buildReceiptFromMutation(item))}
              />
            ))}
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={mutations.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemName="transaksi"
              itemsPerPageOptions={[15, 30, 50]}
            />
          </>
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
