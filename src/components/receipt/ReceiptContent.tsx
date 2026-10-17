import React from 'react';
import type { ReceiptData } from '../../types/receipt';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface ReceiptContentProps {
  receipt: ReceiptData;
}

export const ReceiptContent: React.FC<ReceiptContentProps> = ({ receipt }) => {
  const formattedDate = new Date(receipt.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = new Date(receipt.date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isNyicil = receipt.paymentType === 'NYICIL';

  return (
    <div
      id="printable-receipt"
      className="bg-white text-slate-900 p-5 rounded-2xl border border-stone-200/90 shadow-sm font-mono text-xs w-full max-w-sm mx-auto select-none"
    >
      {/* Header Toko */}
      <div className="text-center pb-3 border-b-2 border-dashed border-stone-300">
        <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">
          Tari Jaya
        </h2>
        <p className="text-[11px] font-bold text-stone-600 mt-0.5">
          Toko Material & Bahan Bangunan
        </p>
        <p className="text-[10px] text-stone-400 mt-0.5">
          Penyedia Material, Semen, Pasir & Besi
        </p>
      </div>

      {/* Info Transaksi & Customer */}
      <div className="py-2.5 border-b border-dashed border-stone-300 space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-stone-500">No. Struk:</span>
          <span className="font-bold text-slate-800">#{receipt.receiptNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Tanggal:</span>
          <span className="font-bold text-slate-800">{formattedDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-500">Waktu:</span>
          <span className="font-bold text-slate-800">{formattedTime} WIB</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-dotted border-stone-200">
          <span className="text-stone-500">Nama Customer:</span>
          <span className="font-extrabold text-slate-900 uppercase">{receipt.customerName}</span>
        </div>
        {receipt.customerPhone && (
          <div className="flex justify-between">
            <span className="text-stone-500">No. HP:</span>
            <span className="font-medium text-slate-700">{receipt.customerPhone}</span>
          </div>
        )}
      </div>

      {/* Daftar Barang Dijual */}
      <div className="py-2.5 border-b border-dashed border-stone-300 space-y-2">
        <div className="text-[10px] font-bold uppercase text-stone-400 tracking-wider flex justify-between">
          <span>Barang Dijual</span>
          <span>Total</span>
        </div>

        {receipt.items.map((item, idx) => (
          <div key={idx} className="text-[11px]">
            <p className="font-bold text-slate-900 leading-tight">{item.name}</p>
            <div className="flex justify-between text-stone-500 mt-0.5">
              <span>
                {formatNumber(item.quantity)} x {formatCurrency(item.unitPrice)}
              </span>
              <span className="font-bold text-slate-800">{formatCurrency(item.subtotal)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Rincian Jumlah & Pembayaran */}
      <div className="py-2.5 border-b-2 border-dashed border-stone-300 space-y-1.5 text-[11px]">
        <div className="flex justify-between items-center text-sm font-black pt-0.5">
          <span className="text-slate-900">JUMLAH TOTAL:</span>
          <span className="text-slate-900">{formatCurrency(receipt.totalAmount)}</span>
        </div>

        <div className="flex justify-between items-center pt-1 border-t border-dotted border-stone-200">
          <span className="text-stone-600 font-bold">PEMBAYARAN:</span>
          <span
            className={`font-black px-2 py-0.5 rounded text-[10px] ${
              isNyicil ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
            }`}
          >
            {isNyicil ? 'NYICIL (KASBON)' : 'LUNAS'}
          </span>
        </div>

        {isNyicil ? (
          <>
            <div className="flex justify-between text-stone-600">
              <span>Uang Muka (DP):</span>
              <span className="font-bold">{formatCurrency(receipt.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between text-red-700 font-bold">
              <span>Sisa Kasbon:</span>
              <span>{formatCurrency(receipt.remainingDebt || (receipt.totalAmount - (receipt.paidAmount || 0)))}</span>
            </div>
            {receipt.dueDate && (
              <div className="flex justify-between text-stone-500 text-[10px]">
                <span>Jatuh Tempo:</span>
                <span>{receipt.dueDate}</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex justify-between text-stone-600">
            <span>Status:</span>
            <span className="font-bold text-emerald-700">LUNAS</span>
          </div>
        )}
      </div>

      {/* Footer Struk */}
      <div className="pt-3 text-center space-y-1">
        <p className="text-[10px] text-stone-400">{formattedDate}</p>
        <p className="font-black text-xs text-slate-900 mt-1 uppercase tracking-tight">
          Terima Kasih atas belanja di Tari Jaya
        </p>
        <p className="text-[10px] text-stone-400 italic">
          Barang yang sudah dibeli mohon dicek kembali saat penerimaan.
        </p>
      </div>
    </div>
  );
};
