import React, { useState, useMemo, useEffect } from 'react';
import { useMutations } from '../hooks/useMutations';
import { MutationListItem } from '../components/mutations/MutationListItem';
import { Pagination } from '../components/common/Pagination';
import { voidMutation } from '../db/operations';
import { useToast } from '../components/common/Toast';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { 
  History, 
  ArrowDownRight, 
  ArrowUpRight, 
  Layers,
  X
} from 'lucide-react';

interface HistoryViewProps {
  unreadMutationIds?: Set<number>;
  onMarkMutationAsRead?: (id: number) => void;
  onMarkAllAsRead?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  unreadMutationIds,
  onMarkMutationAsRead,
  onMarkAllAsRead,
}) => {
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  const { mutations, refresh } = useMutations(filterType, filterDate);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterDate]);

  const handleVoid = async (id: number) => {
    try {
      await voidMutation(id);
      showToast('Transaksi berhasil dibatalkan dan stok dikembalikan', 'info');
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal membatalkan transaksi';
      showToast(msg, 'error');
    }
  };

  // Calculate totals from filtered list (across all pages)
  const totalInValue = mutations
    .filter(m => m.type === 'IN')
    .reduce((acc, m) => acc + m.quantity * m.unit_cost, 0);
  const totalOutValue = mutations
    .filter(m => m.type === 'OUT')
    .reduce((acc, m) => acc + m.quantity * m.unit_price, 0);
  const totalProfit = mutations
    .filter(m => m.type === 'OUT')
    .reduce((acc, m) => acc + m.gross_profit, 0);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(mutations.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, mutations.length);

  const paginatedMutations = useMemo(() => {
    return mutations.slice(startIndex, endIndex);
  }, [mutations, startIndex, endIndex]);

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Top Filter Bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-4 pt-3 pb-2 border-b border-stone-200 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900">Log Mutasi & Riwayat</h2>
          </div>
          <span className="text-xs font-mono font-bold text-stone-600">
            {formatNumber(mutations.length)} Transaksi
          </span>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Type Segmented Buttons */}
          <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200 flex-1">
            <button
              onClick={() => setFilterType('ALL')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition min-h-[34px] ${
                filterType === 'ALL'
                  ? 'bg-orange-500 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('IN')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1 min-h-[34px] ${
                filterType === 'IN'
                  ? 'bg-orange-600 text-white font-bold shadow-xs'
                  : 'text-orange-700 hover:text-orange-800'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
            <button
              onClick={() => setFilterType('OUT')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center space-x-1 min-h-[34px] ${
                filterType === 'OUT'
                  ? 'bg-red-600 text-white font-bold shadow-xs'
                  : 'text-red-600 hover:text-red-700'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>

          {/* Date Picker Filter */}
          <div className="relative">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-300 text-slate-900 text-xs rounded-xl focus:outline-none focus:border-orange-500 font-mono min-h-[34px]"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-slate-900"
                title="Hapus filter tanggal"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Summary Pill for Filtered Selection */}
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

      {/* Mutations Feed */}
      <div className="px-4 mt-3 space-y-2.5">
        {unreadMutationIds && unreadMutationIds.size > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-2.5 flex items-center justify-between text-xs animate-fade-in shadow-2xs">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-ping" />
              <span className="font-bold text-orange-950 text-xs">
                {unreadMutationIds.size} transaksi baru saja dilakukan
              </span>
            </div>
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="px-2.5 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-[10px] shadow-xs active:scale-95 transition"
            >
              Tandai Terbaca (Read All)
            </button>
          </div>
        )}

        {mutations.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center my-6 shadow-xs">
            <Layers className="w-10 h-10 text-stone-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Belum ada riwayat mutasi</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
              {filterDate || filterType !== 'ALL'
                ? 'Tidak ada transaksi yang cocok dengan kriteria filter yang dipilih.'
                : 'Catat barang masuk atau keluar untuk melihat jejak audit mutasi di sini.'}
            </p>
          </div>
        ) : (
          paginatedMutations.map((m) => (
            <MutationListItem 
              key={m.id} 
              mutation={m} 
              onVoid={handleVoid}
              isUnread={unreadMutationIds?.has(m.id!)}
              onMarkAsRead={onMarkMutationAsRead}
            />
          ))
        )}

        {/* Pagination Navigation */}
        {mutations.length > 0 && (
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
        )}
      </div>
    </div>
  );
};
