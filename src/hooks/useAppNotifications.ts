import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/schema';
import type { NavTab } from '../components/layout/BottomNav';

const READ_MUTATIONS_KEY = 'tari_read_mutation_ids';
const READ_DEBTS_KEY = 'tari_read_debt_ids';
const LOW_STOCK_DISMISSED_KEY = 'tari_low_stock_dismissed';

function getStoredIdSet(key: string): Set<number> {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return new Set();
    const arr = JSON.parse(stored);
    if (Array.isArray(arr)) {
      return new Set(arr.filter((id): id is number => typeof id === 'number'));
    }
  } catch {
    // Ignore JSON errors
  }
  return new Set();
}

function saveIdSet(key: string, set: Set<number>) {
  try {
    // Cap to recent 500 IDs to avoid unbounded growth
    const arr = Array.from(set).slice(-500);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // Ignore storage quota errors
  }
}

export function useAppNotifications(lowStockActualCount: number = 0) {
  const [unreadMutationIds, setUnreadMutationIds] = useState<Set<number>>(new Set());
  const [unreadDebtIds, setUnreadDebtIds] = useState<Set<number>>(new Set());
  const [isLowStockDismissed, setIsLowStockDismissed] = useState<boolean>(() => {
    return localStorage.getItem(LOW_STOCK_DISMISSED_KEY) === 'true';
  });

  const refresh = useCallback(async () => {
    try {
      // 1. Mutations unread check
      const allMutations = await db.stock_mutations.toArray();
      const readMutationSet = getStoredIdSet(READ_MUTATIONS_KEY);

      // On first launch if localStorage is completely unset, initialize all existing as read
      const isFirstMutationsRun = localStorage.getItem(READ_MUTATIONS_KEY) === null;
      if (isFirstMutationsRun && allMutations.length > 0) {
        allMutations.forEach((m) => {
          if (m.id) readMutationSet.add(m.id);
        });
        saveIdSet(READ_MUTATIONS_KEY, readMutationSet);
      }

      const unreadMutSet = new Set<number>();
      for (const m of allMutations) {
        if (m.id && !readMutationSet.has(m.id)) {
          unreadMutSet.add(m.id);
        }
      }
      setUnreadMutationIds(unreadMutSet);

      // 2. Debts unread check
      const allDebts = await db.debts.toArray();
      const readDebtSet = getStoredIdSet(READ_DEBTS_KEY);

      const isFirstDebtsRun = localStorage.getItem(READ_DEBTS_KEY) === null;
      if (isFirstDebtsRun && allDebts.length > 0) {
        allDebts.forEach((d) => {
          if (d.id) readDebtSet.add(d.id);
        });
        saveIdSet(READ_DEBTS_KEY, readDebtSet);
      }

      const unreadDbSet = new Set<number>();
      for (const d of allDebts) {
        if (d.id && !readDebtSet.has(d.id) && d.status !== 'PAID') {
          unreadDbSet.add(d.id);
        }
      }
      setUnreadDebtIds(unreadDbSet);
    } catch (err) {
      console.error('Failed refreshing notifications:', err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // If low stock count changes, reset dismissal if new low stock items appear
  useEffect(() => {
    if (lowStockActualCount === 0) {
      setIsLowStockDismissed(true);
      localStorage.setItem(LOW_STOCK_DISMISSED_KEY, 'true');
    }
  }, [lowStockActualCount]);

  const markMutationAsRead = useCallback((mutationId: number) => {
    const currentRead = getStoredIdSet(READ_MUTATIONS_KEY);
    currentRead.add(mutationId);
    saveIdSet(READ_MUTATIONS_KEY, currentRead);

    setUnreadMutationIds((prev) => {
      const next = new Set(prev);
      next.delete(mutationId);
      return next;
    });
  }, []);

  const markAllMutationsAsRead = useCallback(async () => {
    try {
      const allMutations = await db.stock_mutations.toArray();
      const currentRead = getStoredIdSet(READ_MUTATIONS_KEY);
      allMutations.forEach((m) => {
        if (m.id) currentRead.add(m.id);
      });
      saveIdSet(READ_MUTATIONS_KEY, currentRead);
      setUnreadMutationIds(new Set());
    } catch {
      setUnreadMutationIds(new Set());
    }
  }, []);

  const markDebtAsRead = useCallback((debtId: number) => {
    const currentRead = getStoredIdSet(READ_DEBTS_KEY);
    currentRead.add(debtId);
    saveIdSet(READ_DEBTS_KEY, currentRead);

    setUnreadDebtIds((prev) => {
      const next = new Set(prev);
      next.delete(debtId);
      return next;
    });
  }, []);

  const markAllDebtsAsRead = useCallback(async () => {
    try {
      const allDebts = await db.debts.toArray();
      const currentRead = getStoredIdSet(READ_DEBTS_KEY);
      allDebts.forEach((d) => {
        if (d.id) currentRead.add(d.id);
      });
      saveIdSet(READ_DEBTS_KEY, currentRead);
      setUnreadDebtIds(new Set());
    } catch {
      setUnreadDebtIds(new Set());
    }
  }, []);

  const dismissLowStockNotification = useCallback(() => {
    setIsLowStockDismissed(true);
    localStorage.setItem(LOW_STOCK_DISMISSED_KEY, 'true');
  }, []);

  const markTabAsRead = useCallback(
    (tab: NavTab) => {
      if (tab === 'history') {
        markAllMutationsAsRead();
      } else if (tab === 'debts') {
        markAllDebtsAsRead();
      } else if (tab === 'dashboard' || tab === 'catalog') {
        dismissLowStockNotification();
      }
    },
    [markAllMutationsAsRead, markAllDebtsAsRead, dismissLowStockNotification]
  );

  return {
    historyUnreadCount: unreadMutationIds.size,
    debtsUnreadCount: unreadDebtIds.size,
    lowStockUnreadCount: !isLowStockDismissed && lowStockActualCount > 0 ? lowStockActualCount : 0,
    unreadMutationIds,
    unreadDebtIds,
    markMutationAsRead,
    markAllMutationsAsRead,
    markDebtAsRead,
    markAllDebtsAsRead,
    dismissLowStockNotification,
    markTabAsRead,
    refreshNotifications: refresh,
  };
}
