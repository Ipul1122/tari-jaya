import React, { useState, useEffect } from 'react';
import type { DebtRecord } from '../../db/schema';
import { formatCurrency, formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { recordDebtPayment } from '../../db/debtOperations';
import { useToast } from '../common/Toast';
import { X, CheckCircle2, Wallet } from 'lucide-react';

interface DebtPaymentModalProps {
  isOpen: boolean;
  debt: DebtRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const DebtPaymentModal: React.FC<DebtPaymentModalProps> = ({
  isOpen,
  debt,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [payAmountInput, setPayAmountInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const remaining = debt ? Math.max(0, debt.total_amount - debt.paid_amount) : 0;

  useEffect(() => {
    if (isOpen && debt) {
      setPayAmountInput('');
    }
  }, [isOpen, debt]);

  if (!isOpen || !debt) return null;

  const currentPayValue = parseRupiahInput(payAmountInput);
  const isPayFull = currentPayValue === remaining;
  const newRemaining = Math.max(0, remaining - currentPayValue);

  const handleQuickPayFull = () => {
    setPayAmountInput(formatRupiahInput(remaining));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPayValue <= 0) {
      showToast('Masukkan nominal pembayaran lebih dari 0', 'error');
      return;
    }
    if (currentPayValue > remaining) {
      showToast('Nominal pembayaran melebihi sisa tagihan', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordDebtPayment(debt.id!, currentPayValue);
      showToast(
        currentPayValue >= remaining
          ? 'Kasbon pelanggan berhasil dilunasi!'
          : `Pembayaran cicilan Rp ${currentPayValue.toLocaleString('id-ID')} berhasil dicatat`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mencatat pembayaran';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-sm rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Catat Pembayaran</h3>
              <p className="text-[11px] text-stone-500">{debt.person_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Summary Box */}
          <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100 space-y-1">
            <div className="flex justify-between text-xs text-stone-600">
              <span>Total Tagihan:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(debt.total_amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-stone-600">
              <span>Sudah Dibayar:</span>
              <span className="font-semibold text-emerald-700">{formatCurrency(debt.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-orange-200/60">
              <span>Sisa Saat Ini:</span>
              <span className="text-orange-700">{formatCurrency(remaining)}</span>
            </div>
          </div>

          {/* Payment Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="debtPaymentInput" className="text-xs font-bold text-slate-900">
                Nominal Pembayaran Sekarang
              </label>
              <button
                type="button"
                onClick={handleQuickPayFull}
                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
              >
                Lunasi Semua
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                Rp
              </span>
              <input
                id="debtPaymentInput"
                type="text"
                inputMode="numeric"
                value={payAmountInput}
                onChange={(e) => setPayAmountInput(formatRupiahInput(e.target.value))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-slate-900 min-h-[44px]"
                autoFocus
              />
            </div>
            {currentPayValue > 0 && (
              <p className="text-[11px] text-stone-500 mt-1.5 flex justify-between">
                <span>Sisa setelah pembayaran:</span>
                <span className={`font-bold ${newRemaining === 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {newRemaining === 0 ? 'LUNAS' : formatCurrency(newRemaining)}
                </span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 active:scale-95 transition min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || currentPayValue <= 0 || currentPayValue > remaining}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition min-h-[44px] flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isPayFull ? 'Simpan & Lunasi' : 'Simpan Pembayaran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
