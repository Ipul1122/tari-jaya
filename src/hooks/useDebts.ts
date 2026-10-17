import { useState, useEffect, useCallback } from 'react';
import { db, type DebtRecord, type DebtType } from '../db/schema';

export type DebtStatusFilter = 'ALL' | 'ACTIVE' | 'PAID';
export type DebtTypeFilter = 'ALL' | DebtType;

export interface DebtSummary {
  totalReceivable: number;      // Sisa piutang belum lunas (uang toko di luar)
  totalPayable: number;         // Sisa hutang belum lunas (kewajiban bayar ke supplier)
  activeReceivableCount: number;
  activePayableCount: number;
  overdueCount: number;
}

export function useDebts(
  typeFilter: DebtTypeFilter = 'PIUTANG',
  statusFilter: DebtStatusFilter = 'ALL',
  searchQuery: string = ''
) {
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [allDebts, setAllDebts] = useState<DebtRecord[]>([]);
  const [summary, setSummary] = useState<DebtSummary>({
    totalReceivable: 0,
    totalPayable: 0,
    activeReceivableCount: 0,
    activePayableCount: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const records = await db.debts.toArray();

      // Sort newest created first
      records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAllDebts(records);

      // Calculate summary
      const today = new Date().toISOString().slice(0, 10);
      let totalReceivable = 0;
      let totalPayable = 0;
      let activeReceivableCount = 0;
      let activePayableCount = 0;
      let overdueCount = 0;

      for (const d of records) {
        const remaining = Math.max(0, d.total_amount - d.paid_amount);
        const isActive = d.status !== 'PAID';

        if (d.type === 'PIUTANG' || d.type === 'HUTANG') {
          if (isActive) {
            totalReceivable += remaining;
            activeReceivableCount += 1;
          }
        }

        if (isActive && d.due_date && d.due_date < today) {
          overdueCount += 1;
        }
      }

      setSummary({
        totalReceivable,
        totalPayable,
        activeReceivableCount,
        activePayableCount,
        overdueCount,
      });

      // Filter list
      let filtered = records;

      if (typeFilter === 'PIUTANG') {
        filtered = filtered.filter((d) => d.type === 'PIUTANG' || d.type === 'HUTANG');
      } else if (typeFilter !== 'ALL') {
        filtered = filtered.filter((d) => d.type === typeFilter);
      }

      if (statusFilter === 'ACTIVE') {
        filtered = filtered.filter((d) => d.status !== 'PAID');
      } else if (statusFilter === 'PAID') {
        filtered = filtered.filter((d) => d.status === 'PAID');
      }

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(
          (d) =>
            d.person_name.toLowerCase().includes(q) ||
            (d.phone && d.phone.toLowerCase().includes(q)) ||
            (d.notes && d.notes.toLowerCase().includes(q))
        );
      }

      setDebts(filtered);
    } catch (err: unknown) {
      console.error('Error fetching debts:', err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, searchQuery]);

  useEffect(() => {
    refresh();
    const handleUpdate = () => refresh();
    window.addEventListener('tari-debts-updated', handleUpdate);
    return () => window.removeEventListener('tari-debts-updated', handleUpdate);
  }, [refresh]);

  return {
    debts,
    allDebts,
    summary,
    loading,
    refresh,
  };
}
