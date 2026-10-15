import React, { useState, useEffect } from 'react';
import type { DebtRecord, DebtType } from '../../db/schema';
import { createDebt, updateDebt } from '../../db/debtOperations';
import { formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { DebtFormFields } from './DebtFormFields';
import { useToast } from '../common/Toast';
import { X, CheckCircle2 } from 'lucide-react';

interface DebtModalProps {
  isOpen: boolean;
  debtToEdit: DebtRecord | null;
  defaultType?: DebtType;
  onClose: () => void;
  onSuccess: () => void;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  debtToEdit,
  defaultType = 'PIUTANG',
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [type, setType] = useState<DebtType>(defaultType);
  const [personName, setPersonName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [totalAmountInput, setTotalAmountInput] = useState<string>('');
  const [paidAmountInput, setPaidAmountInput] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (debtToEdit) {
        setType(debtToEdit.type);
        setPersonName(debtToEdit.person_name);
        setPhone(debtToEdit.phone || '');
        setTotalAmountInput(formatRupiahInput(debtToEdit.total_amount));
        setPaidAmountInput(formatRupiahInput(debtToEdit.paid_amount));
        setDueDate(debtToEdit.due_date || '');
        setNotes(debtToEdit.notes || '');
      } else {
        setType(defaultType);
        setPersonName('');
        setPhone('');
        setTotalAmountInput('');
        setPaidAmountInput('');
        setDueDate('');
        setNotes('');
      }
    }
  }, [isOpen, debtToEdit, defaultType]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = personName.trim();
    if (!trimmedName) {
      showToast('Nama pelanggan atau supplier wajib diisi', 'error');
      return;
    }

    const total = parseRupiahInput(totalAmountInput);
    if (total <= 0) {
      showToast('Total nominal tagihan harus lebih dari Rp 0', 'error');
      return;
    }

    const paid = parseRupiahInput(paidAmountInput);
    if (paid > total) {
      showToast('Uang muka / jumlah dibayar tidak boleh melebihi total nominal', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (debtToEdit?.id) {
        await updateDebt(debtToEdit.id, {
          type,
          person_name: trimmedName,
          phone: phone.trim() || undefined,
          total_amount: total,
          paid_amount: paid,
          due_date: dueDate || undefined,
          notes: notes.trim() || undefined,
        });
        showToast('Catatan hutang piutang berhasil diperbarui', 'success');
      } else {
        await createDebt({
          type,
          person_name: trimmedName,
          phone: phone.trim() || undefined,
          total_amount: total,
          paid_amount: paid,
          due_date: dueDate || undefined,
          notes: notes.trim() || undefined,
        });
        showToast('Catatan baru berhasil ditambahkan', 'success');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md max-h-[90vh] flex flex-col rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {debtToEdit ? 'Ubah Catatan' : 'Tambah Catatan Baru'}
            </h3>
            <p className="text-[11px] text-stone-500 font-medium">Buku Hutang & Piutang Toko</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <DebtFormFields
            type={type}
            setType={setType}
            personName={personName}
            setPersonName={setPersonName}
            phone={phone}
            setPhone={setPhone}
            totalAmountInput={totalAmountInput}
            setTotalAmountInput={setTotalAmountInput}
            paidAmountInput={paidAmountInput}
            setPaidAmountInput={setPaidAmountInput}
            dueDate={dueDate}
            setDueDate={setDueDate}
            notes={notes}
            setNotes={setNotes}
          />

          {/* Actions */}
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
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-stone-300 text-white font-bold text-xs shadow-md shadow-orange-600/20 active:scale-95 transition min-h-[44px] flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{debtToEdit ? 'Simpan Perubahan' : 'Tambah Catatan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
