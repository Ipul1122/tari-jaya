import React from 'react';
import { formatRupiahInput } from '../../utils/formatters';
import { User, Phone, Calendar, FileText } from 'lucide-react';

interface DebtFormFieldsProps {
  personName: string;
  setPersonName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  totalAmountInput: string;
  setTotalAmountInput: (val: string) => void;
  paidAmountInput: string;
  setPaidAmountInput: (val: string) => void;
  dueDate: string;
  setDueDate: (val: string) => void;
  notes: string;
  setNotes: (val: string) => void;
}

export const DebtFormFields: React.FC<DebtFormFieldsProps> = ({
  personName,
  setPersonName,
  phone,
  setPhone,
  totalAmountInput,
  setTotalAmountInput,
  paidAmountInput,
  setPaidAmountInput,
  dueDate,
  setDueDate,
  notes,
  setNotes,
}) => {
  return (
    <>
      {/* Person Name (Pelanggan) */}
      <div>
        <label htmlFor="debtPersonName" className="text-xs font-bold text-slate-900 block mb-1">
          Nama Pelanggan / Tukang / Mandor <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
            <User className="w-4 h-4" />
          </span>
          <input
            id="debtPersonName"
            type="text"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Contoh: Pak Joko (Mandor) / Pak Budi Tukang / Proyek Pak Hendra"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-slate-900 min-h-[44px]"
            required
            autoFocus
          />
        </div>
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="debtPhone" className="text-xs font-bold text-slate-900 block mb-1">
          No. WhatsApp / Telepon <span className="text-stone-400 font-normal">(opsional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
            <Phone className="w-4 h-4" />
          </span>
          <input
            id="debtPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-slate-900 min-h-[44px]"
          />
        </div>
      </div>

      {/* Total & Paid Amount Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="debtTotalAmount" className="text-xs font-bold text-slate-900 block mb-1">
            Total Kasbon <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
              Rp
            </span>
            <input
              id="debtTotalAmount"
              type="text"
              inputMode="numeric"
              value={totalAmountInput}
              onChange={(e) => setTotalAmountInput(formatRupiahInput(e.target.value))}
              placeholder="0"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold text-slate-900 min-h-[44px]"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="debtPaidAmount" className="text-xs font-bold text-slate-900 block mb-1">
            Uang Muka / Titipan
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
              Rp
            </span>
            <input
              id="debtPaidAmount"
              type="text"
              inputMode="numeric"
              value={paidAmountInput}
              onChange={(e) => setPaidAmountInput(formatRupiahInput(e.target.value))}
              placeholder="0"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-bold text-slate-900 min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor="debtDueDate" className="text-xs font-bold text-slate-900 block mb-1">
          Tanggal Janji Bayar <span className="text-stone-400 font-normal">(opsional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400">
            <Calendar className="w-4 h-4" />
          </span>
          <input
            id="debtDueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm text-slate-900 min-h-[44px]"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="debtNotes" className="text-xs font-bold text-slate-900 block mb-1">
          Catatan / Rincian Material <span className="text-stone-400 font-normal">(opsional)</span>
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-3 text-stone-400">
            <FileText className="w-4 h-4" />
          </span>
          <textarea
            id="debtNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Contoh: Semen 20 sak, Pasir 1 Colt, Besi 10mm 15 btg"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs text-slate-900 resize-none min-h-[44px]"
          />
        </div>
      </div>
    </>
  );
};
