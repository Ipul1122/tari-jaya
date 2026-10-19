import type { ReceiptData } from '../types/receipt';
import { formatCurrency, formatNumber } from './formatters';

export function generateReceiptHtml(receipt: ReceiptData): string {
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
  const remaining = receipt.remainingDebt ?? (receipt.totalAmount - (receipt.paidAmount || 0));

  const itemsHtml = receipt.items
    .map(
      (item) => `
    <div style="margin-bottom: 5px;">
      <div style="font-weight: bold; font-size: 11px;">${item.name}</div>
      <div style="display: flex; justify-content: space-between; font-size: 10px; color: #222;">
        <span>${formatNumber(item.quantity)} x ${formatCurrency(item.unitPrice)}</span>
        <span style="font-weight: bold;">${formatCurrency(item.subtotal)}</span>
      </div>
    </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Struk - Tari Jaya</title>
  <style>
    @page {
      size: auto;
      margin: 4mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      line-height: 1.3;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 4px;
    }
    .receipt {
      max-width: 320px;
      margin: 0 auto;
      padding: 4px;
    }
    .text-center { text-align: center; }
    .dashed { border-bottom: 1px dashed #000; margin: 6px 0; }
    .double-dashed { border-bottom: 2px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 2px 0; }
    .bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="text-center">
      <div style="font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">TARI JAYA</div>
      <div style="font-size: 10px; font-weight: bold; margin-top: 1px;">TOKO MATERIAL & BAHAN BANGUNAN</div>
      <div style="font-size: 9px; color: #444;">Penyedia Material, Semen, Pasir & Besi</div>
    </div>

    <div class="dashed"></div>

    <div class="row"><span>No. Struk:</span><span class="bold">#${receipt.receiptNumber}</span></div>
    <div class="row"><span>Tanggal:</span><span>${formattedDate}</span></div>
    <div class="row"><span>Waktu:</span><span>${formattedTime} WIB</span></div>
    <div class="row"><span>Customer:</span><span class="bold uppercase">${receipt.customerName}</span></div>
    ${receipt.customerPhone ? `<div class="row"><span>No. HP / WA:</span><span>${receipt.customerPhone}</span></div>` : ''}

    <div class="dashed"></div>
    <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">Daftar Barang:</div>
    ${itemsHtml}

    <div class="double-dashed"></div>

    <div class="row" style="font-size: 13px; font-weight: 900;">
      <span>TOTAL:</span>
      <span>${formatCurrency(receipt.totalAmount)}</span>
    </div>
    <div class="row" style="margin-top: 4px;">
      <span>PEMBAYARAN:</span>
      <span class="bold">${isNyicil ? 'NYICIL (KASBON)' : 'LUNAS'}</span>
    </div>
    ${
      isNyicil
        ? `
    <div class="row"><span>Uang Muka (DP):</span><span class="bold">${formatCurrency(receipt.paidAmount || 0)}</span></div>
    <div class="row"><span>Sisa Kasbon:</span><span class="bold">${formatCurrency(remaining)}</span></div>
    ${receipt.dueDate ? `<div class="row"><span>Jatuh Tempo:</span><span>${receipt.dueDate}</span></div>` : ''}
    `
        : ''
    }

    <div class="dashed"></div>

    <div class="text-center" style="margin-top: 8px;">
      <div style="font-size: 11px; font-weight: bold; text-transform: uppercase;">Terima Kasih atas belanja di Tari Jaya</div>
      <div style="font-size: 9px; color: #555; margin-top: 2px;">Barang yang sudah dibeli mohon dicek kembali.</div>
    </div>
  </div>
</body>
</html>`;
}

declare global {
  interface Window {
    AndroidPrint?: {
      printHtml: (html: string) => void;
    };
  }
}

export function printReceipt(receipt: ReceiptData): void {
  const html = generateReceiptHtml(receipt);

  // 1. Native Android print handler via AndroidPrintBridge in MainActivity
  if (
    typeof window !== 'undefined' &&
    window.AndroidPrint &&
    typeof window.AndroidPrint.printHtml === 'function'
  ) {
    try {
      window.AndroidPrint.printHtml(html);
      return;
    } catch (err) {
      console.warn('Native Android print failed, falling back to iframe print', err);
    }
  }

  // 2. Standard Web Browser / Desktop print fallback via iframe
  const existingFrame = document.getElementById('tari-receipt-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  const printFrame = document.createElement('iframe');
  printFrame.id = 'tari-receipt-print-frame';
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = 'none';
  printFrame.style.opacity = '0';
  document.body.appendChild(printFrame);

  const doc = printFrame.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    try {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 250);
}
