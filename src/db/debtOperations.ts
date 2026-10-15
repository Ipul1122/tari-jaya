import { db, type DebtRecord, type DebtStatus } from './schema';

export type CreateDebtParams = Omit<DebtRecord, 'id' | 'created_at' | 'updated_at' | 'status'> & {
  status?: DebtStatus;
};

/**
 * Buat Catatan Hutang / Piutang Baru
 */
export async function createDebt(params: CreateDebtParams): Promise<number> {
  const personName = params.person_name.trim();
  if (!personName) {
    throw new Error('Nama pelanggan atau supplier wajib diisi');
  }

  const totalAmount = Math.round(params.total_amount);
  if (totalAmount <= 0) {
    throw new Error('Total nominal harus lebih dari 0');
  }

  const paidAmount = Math.max(0, Math.round(params.paid_amount || 0));
  if (paidAmount > totalAmount) {
    throw new Error('Jumlah yang dibayar tidak boleh melebihi total nominal');
  }

  let status: DebtStatus = 'UNPAID';
  if (paidAmount >= totalAmount) {
    status = 'PAID';
  } else if (paidAmount > 0) {
    status = 'PARTIAL';
  }

  const now = new Date().toISOString();

  return await db.debts.add({
    type: params.type,
    person_name: personName,
    phone: params.phone?.trim() || undefined,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    due_date: params.due_date || undefined,
    status,
    notes: params.notes?.trim() || undefined,
    created_at: now,
    updated_at: now
  });
}

/**
 * Perbarui Data Hutang / Piutang
 */
export async function updateDebt(
  id: number,
  updates: Partial<Omit<DebtRecord, 'id' | 'created_at'>>
): Promise<void> {
  const existing = await db.debts.get(id);
  if (!existing) {
    throw new Error('Catatan hutang/piutang tidak ditemukan');
  }

  const total = updates.total_amount !== undefined ? Math.round(updates.total_amount) : existing.total_amount;
  const paid = updates.paid_amount !== undefined ? Math.round(updates.paid_amount) : existing.paid_amount;

  if (total <= 0) throw new Error('Total nominal harus lebih dari 0');
  if (paid < 0) throw new Error('Jumlah dibayar tidak boleh negatif');
  if (paid > total) throw new Error('Jumlah dibayar melebihi total nominal');

  let status: DebtStatus = 'UNPAID';
  if (paid >= total) {
    status = 'PAID';
  } else if (paid > 0) {
    status = 'PARTIAL';
  }

  const payload: Partial<DebtRecord> = {
    ...updates,
    total_amount: total,
    paid_amount: paid,
    status,
    updated_at: new Date().toISOString()
  };

  if (updates.person_name) payload.person_name = updates.person_name.trim();
  if (updates.phone !== undefined) payload.phone = updates.phone.trim() || undefined;
  if (updates.notes !== undefined) payload.notes = updates.notes.trim() || undefined;

  await db.debts.update(id, payload);
}

/**
 * Catat Pembayaran Cicilan / Pelunasan Hutang Piutang
 */
export async function recordDebtPayment(id: number, paymentAmount: number): Promise<void> {
  const amount = Math.round(paymentAmount);
  if (amount <= 0) {
    throw new Error('Nominal pembayaran harus lebih besar dari 0');
  }

  await db.transaction('rw', db.debts, async () => {
    const debt = await db.debts.get(id);
    if (!debt) throw new Error('Catatan hutang/piutang tidak ditemukan');

    const remaining = debt.total_amount - debt.paid_amount;
    if (remaining <= 0) {
      throw new Error('Catatan ini sudah lunas sebelumnya');
    }

    if (amount > remaining) {
      throw new Error(`Nominal pembayaran (Rp ${amount.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${remaining.toLocaleString('id-ID')})`);
    }

    const newPaid = debt.paid_amount + amount;
    const newStatus: DebtStatus = newPaid >= debt.total_amount ? 'PAID' : 'PARTIAL';

    await db.debts.update(id, {
      paid_amount: newPaid,
      status: newStatus,
      updated_at: new Date().toISOString()
    });
  });
}

/**
 * Hapus Catatan Hutang Piutang
 */
export async function deleteDebt(id: number): Promise<void> {
  await db.debts.delete(id);
}
