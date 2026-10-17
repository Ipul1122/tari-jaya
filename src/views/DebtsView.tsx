import React, { useState } from 'react';
import { useDebts, type DebtStatusFilter } from '../hooks/useDebts';
import { DebtCard } from '../components/debts/DebtCard';
import { DebtModal } from '../components/debts/DebtModal';
import { DebtPaymentModal } from '../components/debts/DebtPaymentModal';
import { deleteDebt } from '../../src/db/debtOperations';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import { Pagination } from '../components/common/Pagination';
import type { DebtRecord } from '../db/schema';
import { Plus, Search, X, BookOpenText, ArrowDownLeft, CheckCircle2 } from 'lucide-react';

export const DebtsView: React.FC = () => {
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<DebtStatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Always filter to 'PIUTANG' (Kasbon Pelanggan)
  const { debts, allDebts, summary, refresh } = useDebts('PIUTANG', statusFilter, searchQuery);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const totalDebts = debts.length;
  const totalPages = Math.max(1, Math.ceil(totalDebts / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDebts = React.useMemo(() => {
    return debts.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  }, [debts, safePage, itemsPerPage]);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [debtToEdit, setDebtToEdit] = useState<DebtRecord | null>(null);
  const [debtToPay, setDebtToPay] = useState<DebtRecord | null>(null);

  const handleOpenAdd = () => {
    setDebtToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleEdit = (debt: DebtRecord) => {
    setDebtToEdit(debt);
    setIsAddModalOpen(true);
  };

  const handlePay = (debt: DebtRecord) => {
    setDebtToPay(debt);
  };

  const handleDelete = async (debt: DebtRecord) => {
    if (!debt.id) return;
    const confirmDelete = window.confirm(`Hapus catatan kasbon atas nama "${debt.person_name}"?`);
    if (!confirmDelete) return;

    try {
      await deleteDebt(debt.id);
      showToast('Catatan kasbon berhasil dihapus', 'info');
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus catatan';
      showToast(msg, 'error');
    }
  };

  // Piutang calculations (all, active, and paid)
  const piutangAllRecords = allDebts.filter((d) => d.type === 'PIUTANG' || d.type === 'HUTANG');
  const paidPiutangRecords = piutangAllRecords.filter((d) => d.status === 'PAID');
  const totalPaidReceivable = paidPiutangRecords.reduce((acc, d) => acc + d.total_amount, 0);

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Top Header Summary Cards (Piutang / Kasbon) */}
      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Kasbon Belum Lunas */}
          <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                Belum Lunas
              </span>
              <div className="w-6 h-6 rounded-lg bg-sky-200/60 flex items-center justify-center text-sky-700">
                <ArrowDownLeft className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-sky-950">
                {formatCurrency(summary.totalReceivable)}
              </div>
              <p className="text-[10px] text-sky-700 font-medium mt-0.5">
                {summary.activeReceivableCount} orang belum lunas
              </p>
            </div>
          </div>

          {/* Kasbon Sudah Lunas */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Sudah Lunas
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-200/60 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-emerald-950">
                {formatCurrency(totalPaidReceivable)}
              </div>
              <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                {paidPiutangRecords.length} kasbon terselesaikan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar & Add Button */}
      <div className="px-4 mt-2 flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama tukang, mandor, proyek, HP, atau catatan..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-stone-200/90 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Hapus Pencarian"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition min-h-[44px] shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tambah Kasbon</span>
        </button>
      </div>

      {/* Status Filter Tabs (Semua, Belum Lunas, Lunas) */}
      <div className="px-4 mt-3">
        <div className="flex bg-stone-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 min-h-[34px] ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-stone-500'
            }`}
          >
            <span>Semua ({piutangAllRecords.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 min-h-[34px] ${
              statusFilter === 'ACTIVE' ? 'bg-white text-sky-700 shadow-xs' : 'text-stone-500'
            }`}
          >
            <span>Belum Lunas ({summary.activeReceivableCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1 min-h-[34px] ${
              statusFilter === 'PAID' ? 'bg-white text-emerald-700 shadow-xs' : 'text-stone-500'
            }`}
          >
            <span>Sudah Lunas ({paidPiutangRecords.length})</span>
          </button>
        </div>
      </div>

      {/* Debt Cards List */}
      <div className="px-4 mt-4 space-y-3">
        {debts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-3">
              <BookOpenText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {statusFilter === 'PAID' 
                ? 'Belum ada kasbon yang lunas' 
                : statusFilter === 'ACTIVE' 
                ? 'Tidak ada kasbon yang belum lunas' 
                : 'Belum ada catatan kasbon pelanggan'}
            </h4>
            <p className="text-xs text-stone-500 mt-1 max-w-[260px] mx-auto">
              {searchQuery
                ? 'Tidak ditemukan kasbon yang cocok dengan pencarian Anda.'
                : 'Gunakan tombol "Tambah Kasbon" di atas untuk mencatat kasbon pelanggan baru.'}
            </p>
          </div>
        ) : (
          <>
            {paginatedDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onPay={handlePay}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={totalDebts}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemName="kasbon"
              itemsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </div>

      {/* Modal Tambah / Edit Kasbon */}
      <DebtModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        debtToEdit={debtToEdit}
        defaultType="PIUTANG"
        onSuccess={() => {
          setIsAddModalOpen(false);
          refresh();
        }}
      />

      {/* Modal Pembayaran Kasbon */}
      <DebtPaymentModal
        isOpen={!!debtToPay}
        debt={debtToPay}
        onClose={() => setDebtToPay(null)}
        onSuccess={() => {
          setDebtToPay(null);
          refresh();
        }}
      />
    </div>
  );
};
