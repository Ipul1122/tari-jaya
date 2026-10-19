import React, { useState, useEffect } from 'react';
import type { BulkItemEntry } from './QuickInOutDrawer';
import { getKnownCustomers, type KnownCustomer, createDebt } from '../../db/debtOperations';
import { recordBulkStockOut } from '../../db/operations';
import { PaymentCustomerSelector } from './PaymentCustomerSelector';
import { PaymentKasbonForm } from './PaymentKasbonForm';
import { formatCurrency, formatNumber } from '../../utils/formatters';
import { buildReceiptFromCheckout } from '../../utils/receiptGenerator';
import type { ReceiptData } from '../../types/receipt';
import { X, CheckCircle2, BookOpenText, AlertCircle, ArrowRight } from 'lucide-react';

interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: BulkItemEntry[];
  totalValue: number;
  totalUnits: number;
  allowNegative: boolean;
  onSuccess: (customerName: string, isKasbon: boolean, receipt?: ReceiptData) => void;
}

export const PaymentCheckoutModal: React.FC<PaymentCheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  totalValue,
  totalUnits,
  allowNegative,
  onSuccess,
}) => {
  const [knownCustomers, setKnownCustomers] = useState<KnownCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCustomer, setSelectedCustomer] = useState<KnownCustomer | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');

  const [paymentType, setPaymentType] = useState<'CASH' | 'KASBON'>('CASH');
  const [dpAmount, setDpAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>('');
  const [debtNotes, setDebtNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null); setSearchQuery(''); setSelectedCustomer(null); setIsCreatingNew(false);
    setNewCustomerName(''); setNewCustomerPhone(''); setPaymentType('CASH'); setDpAmount(0);
    setDueDate(''); setDebtNotes('');
    getKnownCustomers().then(setKnownCustomers);
  }, [isOpen]);

  const effectiveCustomerName = selectedCustomer
    ? selectedCustomer.name
    : (newCustomerName.trim() || searchQuery.trim());

  const isKasbon = paymentType === 'KASBON';
  const remainingDebt = Math.max(0, totalValue - dpAmount);

  const handleSelectCustomer = (customer: KnownCustomer) => {
    setSelectedCustomer(customer);
    setIsCreatingNew(false);
    setNewCustomerName(customer.name);
    setNewCustomerPhone(customer.phone || '');
    setError(null);
  };

  const handleStartNewCustomer = () => {
    setSelectedCustomer(null);
    setIsCreatingNew(true);
    setNewCustomerName(searchQuery.trim());
    setNewCustomerPhone('');
    setError(null);
  };

  const handleResetCustomer = () => {
    setSelectedCustomer(null);
    setIsCreatingNew(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isKasbon && dpAmount > totalValue) {
      setError('Uang muka tidak boleh melebihi total belanja');
      return;
    }

    const finalCustomerName = effectiveCustomerName || 'Umum';

    setIsSubmitting(true);
    try {
      const mutationNote = isKasbon
        ? `Kasbon: ${finalCustomerName} (Sisa ${formatCurrency(remainingDebt)})`
        : (finalCustomerName === 'Umum' ? 'Penjualan Lunas (Umum)' : `Pembeli: ${finalCustomerName} (Lunas)`);

      const batchId = `SALE-${Date.now()}`;

      await recordBulkStockOut(
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes ? `${mutationNote} - ${item.notes}` : mutationNote,
          customerName: finalCustomerName,
          batchId,
          allowNegativeStock: allowNegative,
        })),
        allowNegative
      );

      const itemSummary = items.map((i) => `${i.product.name} (${i.quantity})`).join(', ');
      await createDebt({
        type: 'PIUTANG',
        person_name: finalCustomerName,
        phone: newCustomerPhone.trim() || selectedCustomer?.phone || undefined,
        total_amount: totalValue,
        paid_amount: isKasbon ? dpAmount : totalValue,
        due_date: dueDate || undefined,
        batch_id: batchId,
        notes: isKasbon
          ? (debtNotes.trim() ? `${debtNotes.trim()} [${itemSummary}]` : `Penjualan kasbon: ${itemSummary}`)
          : `Penjualan lunas: ${itemSummary}`,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tari-debts-updated'));
      }

      const receipt = buildReceiptFromCheckout(
        items,
        finalCustomerName,
        newCustomerPhone.trim() || selectedCustomer?.phone,
        totalValue,
        isKasbon,
        dpAmount,
        dueDate,
        batchId
      );

      onSuccess(finalCustomerName, isKasbon, receipt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memproses pembayaran';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-lg bg-[#FAF8F5] border border-stone-200 rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl animate-slide-up text-slate-900 pb-safe"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200 bg-white sm:rounded-t-2xl shrink-0">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pembayaran & Konfirmasi</h3>
            <p className="text-[11px] text-stone-500 font-medium">
              Total {items.length} jenis ({formatNumber(totalUnits)} unit) • <b className="font-mono text-slate-900">{formatCurrency(totalValue)}</b>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Selection & Creation */}
          <PaymentCustomerSelector
            knownCustomers={knownCustomers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCustomer={selectedCustomer}
            onSelectCustomer={handleSelectCustomer}
            isCreatingNew={isCreatingNew}
            onStartNewCustomer={handleStartNewCustomer}
            onResetCustomer={handleResetCustomer}
            newCustomerName={newCustomerName}
            onNewCustomerNameChange={setNewCustomerName}
            newCustomerPhone={newCustomerPhone}
            onNewCustomerPhoneChange={setNewCustomerPhone}
          />

          {/* Payment Type Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-900 block">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('CASH')}
                className={`p-3 rounded-2xl border text-left transition active:scale-95 flex flex-col justify-between min-h-[70px] ${
                  !isKasbon
                    ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold">Lunas / Tunai</span>
                  <CheckCircle2 className={`w-4 h-4 ${!isKasbon ? 'text-emerald-600' : 'text-stone-300'}`} />
                </div>
                <span className="text-[10px] text-stone-500 font-normal">Bayar langsung penuh</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('KASBON')}
                className={`p-3 rounded-2xl border text-left transition active:scale-95 flex flex-col justify-between min-h-[70px] ${
                  isKasbon
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                    : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold">Kasbon / Piutang</span>
                  <BookOpenText className={`w-4 h-4 ${isKasbon ? 'text-amber-600' : 'text-stone-300'}`} />
                </div>
                <span className="text-[10px] text-stone-500 font-normal">Catat ke Buku Piutang</span>
              </button>
            </div>
          </div>

          {/* Kasbon Details Form */}
          {isKasbon && (
            <PaymentKasbonForm
              dpAmount={dpAmount}
              onDpAmountChange={setDpAmount}
              remainingDebt={remainingDebt}
              dueDate={dueDate}
              onDueDateChange={setDueDate}
              debtNotes={debtNotes}
              onDebtNotesChange={setDebtNotes}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-stone-200 shrink-0 flex space-x-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-1/3 py-3 px-4 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 active:scale-95 transition min-h-[46px]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isSubmitting}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-xs shadow-md active:scale-95 transition flex items-center justify-center space-x-1.5 min-h-[46px] ${
              isKasbon
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
            }`}
          >
            <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi & Masuk Riwayat'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
