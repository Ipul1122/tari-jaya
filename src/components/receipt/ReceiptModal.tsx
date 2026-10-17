import React, { useState, useEffect, useMemo } from 'react';
import type { ReceiptData } from '../../types/receipt';
import { ReceiptContent } from './ReceiptContent';
import { formatReceiptWhatsAppText } from '../../utils/receiptGenerator';
import { printReceipt } from '../../utils/printReceipt';
import { getKnownCustomers } from '../../db/debtOperations';
import { useToast } from '../common/Toast';
import { 
  X, 
  Printer, 
  MessageCircle, 
  Copy, 
  Check, 
  Receipt,
  Phone,
  AlertCircle
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: ReceiptData | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState<boolean>(false);
  const [phone, setPhone] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !receipt) return;
    setPhoneError(null);
    if (receipt.customerPhone) {
      setPhone(receipt.customerPhone);
    } else if (receipt.customerName && receipt.customerName !== 'Pelanggan Umum') {
      getKnownCustomers()
        .then((list) => {
          const match = list.find(
            (c) => c.name.toLowerCase() === receipt.customerName.toLowerCase()
          );
          if (match?.phone) {
            setPhone(match.phone);
          } else {
            setPhone('');
          }
        })
        .catch(() => setPhone(''));
    } else {
      setPhone('');
    }
  }, [isOpen, receipt]);

  const currentReceipt = useMemo<ReceiptData | null>(() => {
    if (!receipt) return null;
    return {
      ...receipt,
      customerPhone: phone.trim() || receipt.customerPhone,
    };
  }, [receipt, phone]);

  if (!isOpen || !receipt || !currentReceipt) return null;

  const handlePrint = () => {
    printReceipt(currentReceipt);
  };

  const handleCopyText = async () => {
    try {
      const text = formatReceiptWhatsAppText(currentReceipt);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Teks struk berhasil disalin ke clipboard', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast('Gagal menyalin teks struk', 'error');
    }
  };

  const handleShareWhatsApp = () => {
    const cleanDigits = phone.replace(/\D/g, '');
    if (!cleanDigits) {
      setPhoneError('Nomor WhatsApp wajib diisi sebelum mengirim');
      showToast('Harap masukkan nomor WhatsApp pelanggan terlebih dahulu!', 'error');
      return;
    }
    if (cleanDigits.length < 8) {
      setPhoneError('Nomor WhatsApp minimal 8 digit angka');
      showToast('Nomor WhatsApp tidak valid (minimal 8 digit)', 'error');
      return;
    }

    setPhoneError(null);
    const formattedPhone = cleanDigits.startsWith('0')
      ? `62${cleanDigits.slice(1)}`
      : cleanDigits.startsWith('62')
      ? cleanDigits
      : `62${cleanDigits}`;

    const text = formatReceiptWhatsAppText(currentReceipt);
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${formattedPhone}?text=${encoded}`;
    showToast(`Mengarahkan ke WhatsApp (${formattedPhone})...`, 'info');
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4 pt-safe pb-safe animate-fade-in print:p-0 print:bg-white print:static">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt, #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 360px !important;
            box-shadow: none !important;
            border: 1px dashed #333 !important;
            margin: 0 auto !important;
            padding: 10px !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div 
        className="w-full max-w-md bg-[#FAF8F5] rounded-3xl border border-stone-200 shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[88vh] overflow-hidden my-auto animate-slide-up print:shadow-none print:border-none print:max-h-none print:w-full print:bg-white print:overflow-visible"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-4 py-3.5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0 no-print sticky top-0 z-10">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Receipt className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Struk Transaksi</h3>
              <p className="text-[11px] text-stone-500">Tari Jaya • Bahan Bangunan</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Receipt Preview */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-stone-100/70 flex justify-center print:bg-white print:p-0 print:overflow-visible">
          <ReceiptContent receipt={currentReceipt} />
        </div>

        {/* WhatsApp Phone Section */}
        <div className="p-3 bg-emerald-50/70 border-t border-emerald-200/80 space-y-1.5 no-print shrink-0">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-emerald-950 flex items-center space-x-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tujuan WhatsApp Pelanggan</span>
            </label>
            {phone.trim().replace(/\D/g, '').length >= 8 ? (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/70 px-2 py-0.5 rounded-full">
                Nomor Terisi
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                Wajib Diisi
              </span>
            )}
          </div>

          <div className="relative">
            <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(null);
              }}
              placeholder="Contoh: 08123456789..."
              className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-white border text-slate-900 font-mono focus:outline-none focus:ring-2 min-h-[38px] ${
                phoneError ? 'border-red-400 focus:ring-red-400/30' : 'border-stone-300 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>

          {phoneError ? (
            <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{phoneError}</span>
            </p>
          ) : !phone.trim() ? (
            <p className="text-[11px] text-amber-800 font-medium">
              * Masukkan nomor WhatsApp pelanggan untuk mengirimkan struk.
            </p>
          ) : (
            <p className="text-[11px] text-emerald-800">
              Kirim ke: <b className="font-mono">{phone}</b> ({receipt.customerName})
            </p>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-3 bg-white border-t border-stone-200 space-y-2 shrink-0 no-print">
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm active:scale-95 transition min-h-[42px]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Struk</span>
            </button>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm active:scale-95 transition min-h-[42px]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs active:scale-95 transition min-h-[42px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs active:scale-[0.99] transition text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
