import type { MutationWithProduct } from '../hooks/useMutations';
import { extractCustomerName } from './customerGrouping';

export interface HistoryGroupContainer {
  id: string;
  type: 'IN' | 'OUT';
  title: string;
  subtitle: string;
  hasKasbon?: boolean;
  totalUnits: number;
  itemTypesCount: number;
  totalValue: number;
  totalProfit: number;
  latestTimestamp: string;
  mutations: MutationWithProduct[];
}

/**
 * Mengelompokkan mutasi riwayat (baik Pemasukan maupun Pengeluaran) ke dalam kontainer
 */
export function groupHistoryMutations(
  mutations: MutationWithProduct[]
): HistoryGroupContainer[] {
  const containerMap = new Map<string, HistoryGroupContainer>();

  for (const m of mutations) {
    if (m.type === 'OUT') {
      // Kelompokkan penjualan berdasarkan nama pelanggan
      const customer = extractCustomerName(m);
      const key = `out-${customer.toLowerCase()}-${m.timestamp.slice(0, 10)}`;
      const isKasbon = !!m.notes && m.notes.toLowerCase().includes('kasbon');
      const subtotal = m.quantity * m.unit_price;

      const existing = containerMap.get(key);
      if (!existing) {
        containerMap.set(key, {
          id: key,
          type: 'OUT',
          title: customer,
          subtitle: isKasbon ? 'Kasbon (Piutang)' : 'Penjualan Lunas',
          hasKasbon: isKasbon,
          totalUnits: m.quantity,
          itemTypesCount: 1,
          totalValue: subtotal,
          totalProfit: m.gross_profit,
          latestTimestamp: m.timestamp,
          mutations: [m],
        });
      } else {
        existing.totalUnits += m.quantity;
        existing.totalValue += subtotal;
        existing.totalProfit += m.gross_profit;
        if (isKasbon) existing.hasKasbon = true;
        if (new Date(m.timestamp) > new Date(existing.latestTimestamp)) {
          existing.latestTimestamp = m.timestamp;
        }
        existing.mutations.push(m);
        existing.itemTypesCount = new Set(existing.mutations.map((item) => item.product_id)).size;
      }
    } else {
      // Kelompokkan barang masuk berdasarkan batch atau sesi waktu (per menit / tanggal)
      const batchKey = m.batch_id || m.timestamp.slice(0, 16);
      const key = `in-${batchKey}`;
      const subtotalCost = m.quantity * m.unit_cost;

      const existing = containerMap.get(key);
      if (!existing) {
        containerMap.set(key, {
          id: key,
          type: 'IN',
          title: 'Pemasukan Barang (Restock)',
          subtitle: 'Pembelian & Penambahan Stok',
          hasKasbon: false,
          totalUnits: m.quantity,
          itemTypesCount: 1,
          totalValue: subtotalCost,
          totalProfit: 0,
          latestTimestamp: m.timestamp,
          mutations: [m],
        });
      } else {
        existing.totalUnits += m.quantity;
        existing.totalValue += subtotalCost;
        if (new Date(m.timestamp) > new Date(existing.latestTimestamp)) {
          existing.latestTimestamp = m.timestamp;
        }
        existing.mutations.push(m);
        existing.itemTypesCount = new Set(existing.mutations.map((item) => item.product_id)).size;
      }
    }
  }

  // Urutkan kontainer dari yang paling baru
  const containers = Array.from(containerMap.values()).sort(
    (a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime()
  );

  // Urutkan item mutasi di dalam masing-masing kontainer dari yang paling baru
  for (const container of containers) {
    container.mutations.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  return containers;
}
