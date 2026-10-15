import React, { useState } from 'react';
import { useDebts, type DebtTypeFilter, type DebtStatusFilter } from '../hooks/useDebts';
import { DebtCard } from '../components/debts/DebtCard';
import { DebtModal } from '../components/debts/DebtModal';
import { DebtPaymentModal } from '../components/debts/DebtPaymentModal';
import { deleteDebt } from '../../src/db/debtOperations';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../components/common/Toast';
import type { DebtRecord, DebtType } from '../db/schema';
import { 
  Plus, 
  Search, 
  X, 
  BookOpenText, 
  ArrowDownLeft, 
  ArrowUpRight 
} from 'lucide-react';

export const DebtsView: React.FC = () => {
  const { showToast } = useToast();

  const [typeFilter, setTypeFilter] = useState<DebtTypeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<DebtStatusFilter>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { debts, summary, refresh } = useDebts(typeFilter, statusFilter, searchQuery);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [debtToEdit, setDebtToEdit] = useState<DebtRecord | null>(null);
  const [debtToPay, setDebtToPay] = useState<DebtRecord | null>(null);
  const [defaultNewType, setDefaultNewType] = useState<DebtType>('PIUTANG');

  const handleOpenAdd = (preferredType: DebtType = 'PIUTANG') => {
    setDefaultNewType(preferredType);
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
    const confirmDelete = window.confirm(`Hapus catatan ${debt.type === 'PIUTANG' ? 'kasbon' : 'hutang'} atas nama "${debt.person_name}"?`);
    if (!confirmDelete) return;

    try {
      await deleteDebt(debt.id);
      showToast('Catatan berhasil dihapus', 'info');
      refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus catatan';
      showToast(msg, 'error');
    }
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Top Header Summary Cards */}
      <div className="px-4 pt-4 pb-2">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Piutang Card (Kasbon Pelanggan) */}
          <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">
                Piutang (Kasbon)
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
                {summary.activeReceivableCount} tagihan pelanggan
              </p>
            </div>
          </div>

          {/* Hutang Card (Kewajiban Supplier) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-100 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Hutang Supplier
              </span>
              <div className="w-6 h-6 rounded-lg bg-amber-200/60 flex items-center justify-center text-amber-700">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-base font-extrabold text-amber-950">
                {formatCurrency(summary.totalPayable)}
              </div>
              <p className="text-[10px] text-amber-700 font-medium mt-0.5">
                {summary.activePayableCount} kewajiban bayar
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
            placeholder="Cari nama, HP, atau catatan..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white border border-stone-200/90 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs min-h-[44px]"
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
          onClick={() => handleOpenAdd(typeFilter === 'HUTANG' ? 'HUTANG' : 'PIUTANG')}
          className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition min-h-[44px] shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Catat</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 mt-3 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {/* Type Tabs */}
        <div className="flex bg-stone-100 p-0.5 rounded-xl shrink-0">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              typeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-stone-500'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setTypeFilter('PIUTANG')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              typeFilter === 'PIUTANG' ? 'bg-white text-sky-700 shadow-xs' : 'text-stone-500'
            }`}
          >
            Piutang
          </button>
          <button
            onClick={() => setTypeFilter('HUTANG')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              typeFilter === 'HUTANG' ? 'bg-white text-amber-700 shadow-xs' : 'text-stone-500'
            }`}
          >
            Hutang
          </button>
        </div>

        {/* Status Toggle */}
        <div className="flex bg-stone-100 p-0.5 rounded-xl shrink-0">
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'ACTIVE' ? 'bg-white text-orange-700 shadow-xs' : 'text-stone-500'
            }`}
          >
            Aktif
          </button>
          <button
            onClick={() => setStatusFilter('PAID')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
              statusFilter === 'PAID' ? 'bg-white text-emerald-700 shadow-xs' : 'text-stone-500'
            }`}
          >
            Lunas
          </button>
        </div>
      </div>

      {/* Debt Cards List */}
      <div className="px-4 mt-4 space-y-3">
        {debts.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white border border-stone-200 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <BookOpenText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Belum ada catatan</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-[260px] mx-auto">
              {searchQuery
                ? 'Tidak ditemukan catatan yang cocok dengan kata kunci pencarian.'
                : statusFilter === 'ACTIVE'
                  ? 'Semua catatan hutang piutang Anda dalam kondisi rapi / lunas.'
                  : 'Belum ada riwayat pelunasan hutang piutang.'}
            </p>
            {!searchQuery && statusFilter === 'ACTIVE' && (
              <button
                onClick={() => handleOpenAdd()}
                className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-sm hover:bg-orange-700 active:scale-95 transition min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Catatan Baru</span>
              </button>
            )}
          </div>
        ) : (
          debts.map((item) => (
            <DebtCard
              key={item.id}
              debt={item}
              onPay={handlePay}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Modals */}
      <DebtModal
        isOpen={isAddModalOpen}
        debtToEdit={debtToEdit}
        defaultType={defaultNewType}
        onClose={() => {
          setIsAddModalOpen(false);
          setDebtToEdit(null);
        }}
        onSuccess={refresh}
      />

      <DebtPaymentModal
        isOpen={!!debtToPay}
        debt={debtToPay}
        onClose={() => setDebtToPay(null)}
        onSuccess={refresh}
      />
    </div>
  );
};
