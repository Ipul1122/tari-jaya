import React from 'react';
import { formatCurrency, formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { Clock } from 'lucide-react';

interface PaymentKasbonFormProps {
  dpAmount: number;
  onDpAmountChange: (amount: number) => void;
  remainingDebt: number;
  dueDate: string;
  onDueDateChange: (date: string) => void;
  debtNotes: string;
  onDebtNotesChange: (notes: string) => void;
}

export const PaymentKasbonForm: React.FC<PaymentKasbonFormProps> = ({
  dpAmount,
  onDpAmountChange,
  remainingDebt,
  dueDate,
  onDueDateChange,
  debtNotes,
  onDebtNotesChange,
}) => {
  return (
    <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-2xl space-y-3 animate-fade-in text-xs">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-bold text-amber-900 mb-1">
            Uang Muka / DP (Rp):
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-stone-400">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={dpAmount === 0 ? '' : formatRupiahInput(dpAmount)}
              onChange={(e) => onDpAmountChange(parseRupiahInput(e.target.value))}
              placeholder="0"
              className="w-full pl-8 pr-2 py-2 rounded-xl bg-white border border-stone-300 font-mono text-xs text-slate-900 focus:outline-none focus:border-amber-500 min-h-[38px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-amber-900 mb-1">
            Sisa Kasbon:
          </label>
          <div className="px-3 py-2 rounded-xl bg-white border border-amber-300 font-mono font-bold text-xs text-red-600 flex items-center min-h-[38px]">
            {formatCurrency(remainingDebt)}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-amber-900 mb-1">
          <Clock className="w-3 h-3 inline mr-1 text-amber-600" />
          Jatuh Tempo (Opsional):
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-amber-500 min-h-[38px]"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-amber-900 mb-1">
          Catatan Kasbon (Opsional):
        </label>
        <input
          type="text"
          value={debtNotes}
          onChange={(e) => onDebtNotesChange(e.target.value)}
          placeholder="Contoh: Janji bayar akhir pekan..."
          className="w-full px-3 py-2 rounded-xl bg-white border border-stone-300 text-xs text-slate-900 focus:outline-none focus:border-amber-500 min-h-[38px]"
        />
      </div>
    </div>
  );
};
