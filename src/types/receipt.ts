export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ReceiptData {
  receiptNumber: string;
  date: string; // ISO string or formatted date
  customerName: string;
  customerPhone?: string;
  items: ReceiptItem[];
  totalAmount: number;
  paymentType: 'LUNAS' | 'NYICIL';
  paidAmount?: number;
  remainingDebt?: number;
  dueDate?: string;
  notes?: string;
}
