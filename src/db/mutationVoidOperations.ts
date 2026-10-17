import { db, type StockMutation, type DebtRecord } from './schema';
import { extractCustomerName } from '../utils/customerGrouping';

export interface VoidMutationResult {
  productName: string;
  cancelledDebt?: {
    id: number;
    personName: string;
    amount: number;
    wasFullyDeleted: boolean;
  };
}

/**
 * Temukan catatan piutang (kasbon) yang terkait dengan mutasi penjualan (OUT)
 */
export async function findLinkedDebt(mutation: StockMutation): Promise<DebtRecord | null> {
  if (mutation.type !== 'OUT') return null;

  // 1. Coba cari berdasarkan batch_id transaksi
  if (mutation.batch_id) {
    const byBatch = await db.debts
      .filter((d) => !!d.batch_id && d.batch_id === mutation.batch_id)
      .first();
    if (byBatch) return byBatch;
  }

  // 2. Fallback: Ekstraksi nama pelanggan dan deteksi kasbon
  const customerName = mutation.customer_name?.trim() || extractCustomerName(mutation as any);
  const isKasbon = !!(mutation.notes && mutation.notes.toLowerCase().includes('kasbon'));

  if (!customerName || !isKasbon) return null;

  const targetName = customerName.toLowerCase();
  const mutTime = new Date(mutation.timestamp).getTime();

  // Cari piutang aktif milik pelanggan ini
  const candidates = await db.debts
    .filter((d) => d.type === 'PIUTANG' && d.person_name.trim().toLowerCase() === targetName)
    .toArray();

  if (candidates.length === 0) return null;

  // Cari produk terkait jika ada untuk memverifikasi catatan
  const prod = await db.products.get(mutation.product_id);
  const prodNameLower = prod?.name.toLowerCase() || '';

  // Prioritas 1: Catatan piutang memuat nama barang ini
  if (prodNameLower) {
    const matchedByNote = candidates.find(
      (c) => c.notes && c.notes.toLowerCase().includes(prodNameLower)
    );
    if (matchedByNote) return matchedByNote;
  }

  // Prioritas 2: Transaksi dibuat di waktu yang berdekatan (toleransi 1 jam)
  let bestMatch: DebtRecord | null = null;
  let minDiff = Infinity;

  for (const c of candidates) {
    const debtTime = new Date(c.created_at).getTime();
    const diff = Math.abs(debtTime - mutTime);
    if (diff < 60 * 60 * 1000 && diff < minDiff) {
      minDiff = diff;
      bestMatch = c;
    }
  }

  return bestMatch;
}

/**
 * Pembatalan Mutasi (Void / Rollback)
 * Mengembalikan stok material ke gudang, serta otomatis membatalkan/mengurangi
 * catatan piutang/kasbon di Buku Piutang jika penjualan dibeli secara kasbon.
 */
export async function voidMutation(
  mutationId: number,
  options?: { cancelLinkedDebt?: boolean }
): Promise<VoidMutationResult> {
  const result = await db.transaction('rw', [db.products, db.stock_mutations, db.debts], async () => {
    const mutation = await db.stock_mutations.get(mutationId);
    if (!mutation) throw new Error('Mutasi tidak ditemukan');

    const product = await db.products.get(mutation.product_id);
    const productName = product?.name || 'Material';

    // 1. Kembalikan stok barang
    if (product) {
      let rolledBackStock = product.current_stock;
      if (mutation.type === 'IN') {
        rolledBackStock = product.current_stock - mutation.quantity;
      } else if (mutation.type === 'OUT') {
        rolledBackStock = product.current_stock + mutation.quantity;
      }

      await db.products.update(product.id!, {
        current_stock: rolledBackStock,
        updated_at: new Date().toISOString(),
      });
    }

    // 2. Cek & sinkronkan pembatalan piutang jika ada
    let cancelledDebtInfo: VoidMutationResult['cancelledDebt'];
    const shouldCancelDebt = options?.cancelLinkedDebt !== false;

    if (shouldCancelDebt && mutation.type === 'OUT') {
      const linkedDebt = await findLinkedDebt(mutation);

      if (linkedDebt && linkedDebt.id) {
        // Cek apakah masih ada mutasi lain dalam batch penjualan yang sama
        let hasOtherMutationsInBatch = false;
        if (mutation.batch_id) {
          const otherMutationsCount = await db.stock_mutations
            .filter((m) => m.batch_id === mutation.batch_id && m.id !== mutationId)
            .count();
          hasOtherMutationsInBatch = otherMutationsCount > 0;
        }

        if (!hasOtherMutationsInBatch) {
          // Semua mutasi dari penjualan ini telah dibatalkan -> Hapus catatan piutang sepenuhnya
          await db.debts.delete(linkedDebt.id);
          cancelledDebtInfo = {
            id: linkedDebt.id,
            personName: linkedDebt.person_name,
            amount: linkedDebt.total_amount,
            wasFullyDeleted: true,
          };
        } else {
          // Hanya satu item yang dibatalkan dari keranjang -> Kurangi nominal piutang
          const itemValue = mutation.quantity * mutation.unit_price;
          const newTotal = Math.max(0, linkedDebt.total_amount - itemValue);

          if (newTotal <= 0 || newTotal <= linkedDebt.paid_amount) {
            await db.debts.delete(linkedDebt.id);
            cancelledDebtInfo = {
              id: linkedDebt.id,
              personName: linkedDebt.person_name,
              amount: linkedDebt.total_amount,
              wasFullyDeleted: true,
            };
          } else {
            const newPaid = Math.min(linkedDebt.paid_amount, newTotal);
            const newStatus = newPaid >= newTotal ? 'PAID' : (newPaid > 0 ? 'PARTIAL' : 'UNPAID');

            await db.debts.update(linkedDebt.id, {
              total_amount: newTotal,
              paid_amount: newPaid,
              status: newStatus,
              updated_at: new Date().toISOString(),
            });

            cancelledDebtInfo = {
              id: linkedDebt.id,
              personName: linkedDebt.person_name,
              amount: itemValue,
              wasFullyDeleted: false,
            };
          }
        }
      }
    }

    // 3. Hapus mutasi dari audit ledger
    await db.stock_mutations.delete(mutationId);

    return {
      productName,
      cancelledDebt: cancelledDebtInfo,
    };
  });

  // Notifikasi event agar tampilan mutasi & piutang / badge di header update seketika
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('tari-mutations-updated'));
    if (result.cancelledDebt) {
      window.dispatchEvent(new CustomEvent('tari-debts-updated'));
    }
  }

  return result;
}
