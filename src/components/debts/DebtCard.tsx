import React from 'react';
import type { DebtRecord } from '../../db/schema';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Pencil, 
  Trash2, 
  Wallet 
} from 'lucide-react';

interface DebtCardProps {
  debt: DebtRecord;
  onPay: (debt: DebtRecord) => void;
  onEdit: (debt: DebtRecord) => void;
  onDelete: (debt: DebtRecord) => void;
}

export const DebtCard: React.FC<DebtCardProps> = ({
  debt,
  onPay,
  onEdit,
  onDelete,
}) => {
  const remaining = Math.max(0, debt.total_amount - debt.paid_amount);
  const percentPaid = Math.min(100, Math.round((debt.paid_amount / debt.total_amount) * 100));
  const isPaid = debt.status === 'PAID';
  const isPiutang = debt.type === 'PIUTANG';

  // Check overdue
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = !isPaid && !!debt.due_date && debt.due_date < today;

  // WhatsApp reminder message
  const handleOpenWhatsApp = () => {
    if (!debt.phone) return;
    const cleanPhone = debt.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0')
      ? '62' + cleanPhone.slice(1)
      : cleanPhone;

    const roleText = isPiutang ? 'tagihan kasbon' : 'kewajiban pembayaran';
    const noteText = debt.notes ? ` untuk ${debt.notes}` : '';
    const message = `Halo Bpk/Ibu ${debt.person_name},\n\nMengingatkan catatan ${roleText} di Toko Tari Jaya${noteText} dengan sisa sebesar *${formatCurrency(remaining)}* (Total: ${formatCurrency(debt.total_amount)}).\n\nTerima kasih.`;

    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className={`p-4 rounded-2xl bg-white border transition shadow-sm ${
      isPaid 
        ? 'border-emerald-200 bg-emerald-50/20' 
        : isOverdue 
          ? 'border-red-300 ring-1 ring-red-200' 
          : 'border-stone-200/90'
    }`}>
      {/* Header: Type Badge & Status */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
          isPiutang 
            ? 'bg-sky-100 text-sky-800 border border-sky-200' 
            : 'bg-amber-100 text-amber-800 border border-amber-200'
        }`}>
          {isPiutang ? 'Kasbon Pelanggan' : 'Hutang ke Supplier'}
        </span>

        {isPaid ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Lunas</span>
          </span>
        ) : isOverdue ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Lewat Tempo</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>{debt.status === 'PARTIAL' ? 'Dicicil' : 'Belum Bayar'}</span>
          </span>
        )}
      </div>

      {/* Person Name & Phone */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900 leading-tight">
            {debt.person_name}
          </h4>
          {debt.phone && (
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              {debt.phone}
            </p>
          )}
        </div>

        {/* Action icons (Edit & Delete) */}
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => onEdit(debt)}
            aria-label="Edit Catatan"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 active:scale-95 transition"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(debt)}
            aria-label="Hapus Catatan"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 active:scale-95 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notes / Details */}
      {debt.notes && (
        <p className="text-xs text-stone-600 mt-2 bg-stone-50 p-2 rounded-xl border border-stone-100">
          {debt.notes}
        </p>
      )}

      {/* Amount and Progress */}
      <div className="mt-3 pt-3 border-t border-stone-100">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-stone-500 font-medium">Sisa Tagihan:</span>
          <span className={`text-base font-extrabold ${isPaid ? 'text-emerald-700' : 'text-slate-900'}`}>
            {formatCurrency(remaining)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden mt-1.5">
          <div 
            className={`h-full transition-all duration-300 ${isPaid ? 'bg-emerald-500' : 'bg-orange-500'}`}
            style={{ width: `${percentPaid}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-400 mt-1">
          <span>Terbayar: {formatCurrency(debt.paid_amount)} ({percentPaid}%)</span>
          <span>Total: {formatCurrency(debt.total_amount)}</span>
        </div>
      </div>

      {/* Due Date & WhatsApp action */}
      <div className="mt-3 pt-2 flex items-center justify-between gap-2">
        {debt.due_date ? (
          <div className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-stone-500'}`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Tempo: {formatDate(debt.due_date)}</span>
          </div>
        ) : (
          <span className="text-[11px] text-stone-400">Tanpa jatuh tempo</span>
        )}

        <div className="flex items-center gap-2">
          {/* WhatsApp Reminder Button */}
          {debt.phone && !isPaid && (
            <button
              onClick={handleOpenWhatsApp}
              className="inline-flex items-center gap-1 py-1.5 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-200 transition min-h-[44px]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WA</span>
            </button>
          )}

          {/* Pay Button */}
          {!isPaid && (
            <button
              onClick={() => onPay(debt)}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm shadow-orange-600/20 active:scale-95 transition min-h-[44px]"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Bayar / Cicil</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
