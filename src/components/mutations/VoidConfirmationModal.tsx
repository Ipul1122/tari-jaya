import React, { useState, useEffect } from 'react';
import type { MutationWithProduct } from '../../hooks/useMutations';
import type { DebtRecord } from '../../db/schema';
import { findLinkedDebt } from '../../db/operations';
import { extractCustomerName } from '../../utils/customerGrouping';
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters';
import { AlertTriangle, User, BookOpenText, X, Loader2, Undo2 } from 'lucide-react';

interface VoidConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  mutation: MutationWithProduct | null;
  isSubmitting?: boolean;
}

export const VoidConfirmationModal: React.FC<VoidConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mutation,
  isSubmitting = false,
}) => {
  const [linkedDebt, setLinkedDebt] = useState<DebtRecord | null>(null);

  useEffect(() => {
    if (!isOpen || !mutation) {
      setLinkedDebt(null);
      return;
    }

    if (mutation.type === 'OUT') {
      findLinkedDebt(mutation).then((debt) => {
        setLinkedDebt(debt);
      });
    } else {
      setLinkedDebt(null);
    }
  }, [isOpen, mutation]);

  if (!isOpen || !mutation) return null;

  const isOut = mutation.type === 'OUT';
  const subtotal = isOut
    ? mutation.quantity * mutation.unit_price
    : mutation.quantity * mutation.unit_cost;

  const customerName = mutation.customer_name?.trim() || extractCustomerName(mutation);
  const isKasbon = !!linkedDebt || (mutation.notes && mutation.notes.toLowerCase().includes('kasbon'));

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-sm bg-[#FAF8F5] border border-stone-200 rounded-3xl shadow-2xl p-5 space-y-4 animate-scale-up text-slate-900"
        role="dialog"
        aria-modal="true"
        aria-labelledby="void-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 id="void-modal-title" className="text-sm font-black text-slate-900 leading-tight">
                Batalkan Transaksi?
              </h3>
              <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                Konfirmasi sebelum stok & data dikembalikan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer Box (for Sales) */}
        {isOut && (
          <div className="p-3 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
              Nama Pembeli / Customer:
            </span>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-slate-900 truncate">
                {customerName}
              </span>
              {isKasbon && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                  Kasbon
                </span>
              )}
            </div>
          </div>
        )}

        {/* Transaction Detail Card */}
        <div className="p-3.5 rounded-2xl bg-white border border-stone-200 space-y-2 text-xs shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {isOut ? 'Penjualan Keluar' : 'Pengadaan Masuk'}
              </span>
              <h4 className="text-xs font-bold text-slate-900 mt-1">
                {mutation.product_name}
              </h4>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono font-extrabold text-slate-900">
                {formatCurrency(subtotal)}
              </p>
              <p className="text-[11px] text-stone-500 font-bold">
                {formatNumber(mutation.quantity)} unit
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 font-mono">
            <span>Waktu:</span>
            <span>{formatDateTime(mutation.timestamp)}</span>
          </div>
        </div>

        {/* Kasbon / Piutang Sync Warning Box */}
        {isKasbon ? (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center space-x-1.5 font-bold text-amber-900">
              <BookOpenText className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Sinkronisasi Buku Piutang</span>
            </div>
            <p className="text-[11px] text-amber-900 leading-relaxed">
              Transaksi ini tercatat sebagai <b>Kasbon</b> atas nama <b>{customerName}</b>. Jika dibatalkan, catatan piutang terkait di Buku Piutang akan <b>otomatis dihapus/dibatalkan</b> agar buku kasbon tidak tertinggal.
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-stone-100/80 border border-stone-200 text-stone-600 text-[11px] leading-relaxed">
            Stok <b>{mutation.product_name}</b> akan dikembalikan ke gudang ({isOut ? `+${mutation.quantity} unit` : `-${mutation.quantity} unit`}).
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs active:scale-95 transition min-h-[44px]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-red-600/20 transition min-h-[44px]"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Undo2 className="w-4 h-4" />
            )}
            <span>Ya, Batalkan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
