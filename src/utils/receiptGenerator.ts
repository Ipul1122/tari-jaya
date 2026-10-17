import type { CustomerSalesContainer } from './customerGrouping';
import type { HistoryGroupContainer } from './historyGrouping';
import type { ReceiptData, ReceiptItem } from '../types/receipt';
import { formatCurrency, formatNumber } from './formatters';

export function buildReceiptFromCustomerContainer(
  container: CustomerSalesContainer
): ReceiptData {
  const items: ReceiptItem[] = container.mutations.map((m) => ({
    name: m.product_name,
    quantity: m.quantity,
    unitPrice: m.unit_price,
    subtotal: m.quantity * m.unit_price,
  }));

  const firstBatchId = container.mutations.find((m) => m.batch_id)?.batch_id;
  const receiptNumber = firstBatchId || `TRX-${new Date(container.latestTimestamp).getTime().toString().slice(-6)}`;

  return {
    receiptNumber,
    date: container.latestTimestamp,
    customerName: container.customerName,
    items,
    totalAmount: container.totalValue,
    paymentType: container.hasKasbon ? 'NYICIL' : 'LUNAS',
  };
}

export function buildReceiptFromHistoryContainer(
  container: HistoryGroupContainer
): ReceiptData {
  const items: ReceiptItem[] = container.mutations.map((m) => ({
    name: m.product_name,
    quantity: m.quantity,
    unitPrice: m.unit_price,
    subtotal: m.quantity * m.unit_price,
  }));

  const firstBatchId = container.mutations.find((m) => m.batch_id)?.batch_id;
  const receiptNumber = firstBatchId || `TRX-${new Date(container.latestTimestamp).getTime().toString().slice(-6)}`;

  return {
    receiptNumber,
    date: container.latestTimestamp,
    customerName: container.title,
    items,
    totalAmount: container.totalValue,
    paymentType: container.hasKasbon ? 'NYICIL' : 'LUNAS',
  };
}

export function buildReceiptFromCheckout(
  items: Array<{ product: { name: string }; quantity: number; unitPrice: number }>,
  customerName: string,
  customerPhone: string | undefined,
  totalAmount: number,
  isKasbon: boolean,
  dpAmount: number,
  dueDate: string | undefined,
  batchId: string
): ReceiptData {
  return {
    receiptNumber: batchId,
    date: new Date().toISOString(),
    customerName,
    customerPhone: customerPhone || undefined,
    items: items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.quantity * i.unitPrice,
    })),
    totalAmount,
    paymentType: isKasbon ? 'NYICIL' : 'LUNAS',
    paidAmount: isKasbon ? dpAmount : totalAmount,
    remainingDebt: isKasbon ? Math.max(0, totalAmount - dpAmount) : 0,
    dueDate: dueDate || undefined,
  };
}

export function buildReceiptFromMutation(
  m: { id?: number; product_name: string; quantity: number; unit_price: number; timestamp: string; customer_name?: string; notes?: string; batch_id?: string }
): ReceiptData {
  const isKasbon = !!m.notes && m.notes.toLowerCase().includes('kasbon');
  return {
    receiptNumber: m.batch_id || `TRX-${m.id || Date.now()}`,
    date: m.timestamp,
    customerName: m.customer_name || 'Pelanggan Umum',
    items: [{
      name: m.product_name,
      quantity: m.quantity,
      unitPrice: m.unit_price,
      subtotal: m.quantity * m.unit_price,
    }],
    totalAmount: m.quantity * m.unit_price,
    paymentType: isKasbon ? 'NYICIL' : 'LUNAS',
  };
}

export function formatReceiptWhatsAppText(receipt: ReceiptData): string {
  const formattedDate = new Date(receipt.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const lines = [
    `*TARI JAYA*`,
    `_Toko Material & Bahan Bangunan_`,
    `=============================`,
    `*No. Struk:* #${receipt.receiptNumber}`,
    `*Tanggal:* ${formattedDate}`,
    `*Customer:* ${receipt.customerName}`,
    `-----------------------------`,
    `*DAFTAR BARANG:*`,
    ...receipt.items.map(
      (item) =>
        `• ${item.name}\n  ${formatNumber(item.quantity)} x ${formatCurrency(item.unitPrice)} = ${formatCurrency(item.subtotal)}`
    ),
    `-----------------------------`,
    `*TOTAL: ${formatCurrency(receipt.totalAmount)}*`,
    `*STATUS: ${receipt.paymentType === 'LUNAS' ? 'LUNAS' : 'NYICIL (KASBON)'}*`,
  ];

  if (receipt.paymentType === 'NYICIL') {
    if (receipt.paidAmount !== undefined) {
      lines.push(`*Uang Muka (DP):* ${formatCurrency(receipt.paidAmount)}`);
    }
    if (receipt.remainingDebt !== undefined) {
      lines.push(`*Sisa Kasbon:* ${formatCurrency(receipt.remainingDebt)}`);
    }
    if (receipt.dueDate) {
      lines.push(`*Jatuh Tempo:* ${receipt.dueDate}`);
    }
  }

  lines.push(`=============================`);
  lines.push(`_Terima Kasih atas belanja di Tari Jaya!_`);

  return lines.join('\n');
}
