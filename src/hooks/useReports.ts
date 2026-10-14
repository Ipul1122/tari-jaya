import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/schema';
import type { StockMutation } from '../db/schema';

export type ReportPeriod = 'today' | '7days' | 'month' | 'year' | 'all';

export interface ReportSummary {
  totalInValue: number;       // Modal yang dikeluarkan untuk barang masuk
  totalOutValue: number;      // Omzet kotor dari barang keluar
  totalGrossProfit: number;   // Total estimasi keuntungan kotor
  totalInQty: number;         // Volume barang masuk (unit)
  totalOutQty: number;        // Volume barang keluar (unit)
  netCashflowEstimate: number;// Omzet Keluar - Belanja Masuk
  mutationCount: number;
}

export function useReports(
  period: ReportPeriod = 'today',
  customYear?: number,
  customMonth?: number
) {
  const [summary, setSummary] = useState<ReportSummary>({
    totalInValue: 0,
    totalOutValue: 0,
    totalGrossProfit: 0,
    totalInQty: 0,
    totalOutQty: 0,
    netCashflowEstimate: 0,
    mutationCount: 0,
  });
  const [periodMutations, setPeriodMutations] = useState<StockMutation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const allMutations = await db.stock_mutations.toArray();
      const now = new Date();

      const filtered = allMutations.filter(m => {
        const itemDate = new Date(m.timestamp);

        if (period === 'all') return true;

        if (period === 'today') {
          return itemDate.toDateString() === now.toDateString();
        }

        if (period === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          return itemDate >= sevenDaysAgo;
        }

        if (period === 'month') {
          const targetYear = customYear ?? now.getFullYear();
          const targetMonth = customMonth ?? now.getMonth();
          return itemDate.getFullYear() === targetYear && itemDate.getMonth() === targetMonth;
        }

        if (period === 'year') {
          const targetYear = customYear ?? now.getFullYear();
          return itemDate.getFullYear() === targetYear;
        }

        return true;
      });

      let totalInValue = 0;
      let totalOutValue = 0;
      let totalGrossProfit = 0;
      let totalInQty = 0;
      let totalOutQty = 0;

      for (const m of filtered) {
        if (m.type === 'IN') {
          totalInQty += m.quantity;
          totalInValue += m.quantity * m.unit_cost;
        } else if (m.type === 'OUT') {
          totalOutQty += m.quantity;
          totalOutValue += m.quantity * m.unit_price;
          totalGrossProfit += m.gross_profit;
        }
      }

      setSummary({
        totalInValue,
        totalOutValue,
        totalGrossProfit,
        totalInQty,
        totalOutQty,
        netCashflowEstimate: totalOutValue - totalInValue,
        mutationCount: filtered.length,
      });

      // Sort newest first
      filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setPeriodMutations(filtered);
    } catch (error) {
      console.error('Error generating reports:', error);
    } finally {
      setLoading(false);
    }
  }, [period, customYear, customMonth]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    summary,
    periodMutations,
    loading,
    refresh,
  };
}
