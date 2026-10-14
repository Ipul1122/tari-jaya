import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/schema';
import type { StockMutation, Product } from '../db/schema';

export interface MutationWithProduct extends StockMutation {
  product_name: string;
}

export function useMutations(
  filterType: 'ALL' | 'IN' | 'OUT' = 'ALL',
  filterDate?: string, // YYYY-MM-DD
  productId?: number
) {
  const [mutations, setMutations] = useState<MutationWithProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const [allMutations, allProducts] = await Promise.all([
        db.stock_mutations.toArray(),
        db.products.toArray(),
      ]);

      const prodMap = new Map<number, Product>();
      allProducts.forEach(p => {
        if (p.id) prodMap.set(p.id, p);
      });

      let list = allMutations;

      if (filterType !== 'ALL') {
        list = list.filter(m => m.type === filterType);
      }

      if (productId) {
        list = list.filter(m => m.product_id === productId);
      }

      if (filterDate) {
        list = list.filter(m => m.timestamp.startsWith(filterDate));
      }

      // Sort newest first
      list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const enriched: MutationWithProduct[] = list.map(m => ({
        ...m,
        product_name: prodMap.get(m.product_id)?.name || 'Produk Dihapus',
      }));

      setMutations(enriched);
    } catch (error) {
      console.error('Error loading mutations:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterDate, productId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    mutations,
    loading,
    refresh,
  };
}
