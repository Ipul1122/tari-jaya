import type { MutationWithProduct } from '../hooks/useMutations';

export interface CustomerSalesContainer {
  customerKey: string;
  customerName: string;
  totalUnits: number;
  itemTypesCount: number;
  totalValue: number;
  totalProfit: number;
  hasKasbon: boolean;
  latestTimestamp: string;
  mutations: MutationWithProduct[];
}

/**
 * Ekstraksi nama pelanggan dari properti customer_name atau dari teks catatan mutasi
 */
export function extractCustomerName(mutation: MutationWithProduct): string {
  if (mutation.customer_name && mutation.customer_name.trim().length > 0) {
    return mutation.customer_name.trim();
  }

  if (mutation.notes) {
    const cleanNotes = mutation.notes.trim();

    // Pola 1: "Pembeli: NamaPelanggan (Lunas)" atau "Pembeli: NamaPelanggan - Catatan"
    const matchPembeli = cleanNotes.match(/^(?:Pembeli|Pelanggan|Customer|Kustomer):\s*([^(\n-]+)/i);
    if (matchPembeli && matchPembeli[1].trim()) {
      return matchPembeli[1].trim();
    }

    // Pola 2: "Kasbon: NamaPelanggan (Sisa Rp...)" atau "Kasbon: NamaPelanggan - Catatan"
    const matchKasbon = cleanNotes.match(/^Kasbon:\s*([^(\n-]+)/i);
    if (matchKasbon && matchKasbon[1].trim()) {
      return matchKasbon[1].trim();
    }
  }

  return 'Pelanggan Umum (Tanpa Nama)';
}

/**
 * Kelompokkan mutasi keluar (penjualan) menjadi kontainer per pelanggan
 */
export function groupMutationsByCustomer(
  mutations: MutationWithProduct[]
): CustomerSalesContainer[] {
  // Hanya proses mutasi keluar (OUT)
  const outMutations = mutations.filter((m) => m.type === 'OUT');
  const groupMap = new Map<string, CustomerSalesContainer>();

  for (const m of outMutations) {
    const rawName = extractCustomerName(m);
    const key = rawName.toLowerCase();
    const isKasbon = !!m.notes && m.notes.toLowerCase().includes('kasbon');

    const existing = groupMap.get(key);
    if (!existing) {
      groupMap.set(key, {
        customerKey: key,
        customerName: rawName,
        totalUnits: m.quantity,
        itemTypesCount: 1,
        totalValue: m.quantity * m.unit_price,
        totalProfit: m.gross_profit,
        hasKasbon: isKasbon,
        latestTimestamp: m.timestamp,
        mutations: [m],
      });
    } else {
      existing.totalUnits += m.quantity;
      existing.totalValue += m.quantity * m.unit_price;
      existing.totalProfit += m.gross_profit;
      if (isKasbon) existing.hasKasbon = true;
      if (new Date(m.timestamp) > new Date(existing.latestTimestamp)) {
        existing.latestTimestamp = m.timestamp;
      }
      existing.mutations.push(m);
      existing.itemTypesCount = new Set(existing.mutations.map((item) => item.product_id)).size;
    }
  }

  // Ubah ke array dan urutkan berdasarkan waktu transaksi terbaru
  const containers = Array.from(groupMap.values()).sort(
    (a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime()
  );

  // Urutkan mutasi di dalam masing-masing kontainer dari yang paling baru
  for (const container of containers) {
    container.mutations.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  return containers;
}
