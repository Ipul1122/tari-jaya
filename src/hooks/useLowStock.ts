import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/schema';
import type { Product } from '../db/schema';

export function useLowStock() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const [allCats, allProducts] = await Promise.all([
        db.categories.toArray(),
        db.products.toArray(),
      ]);

      const catMap: Record<number, string> = {};
      allCats.forEach(c => {
        if (c.id) catMap[c.id] = c.name;
      });
      setCategoriesMap(catMap);

      // Low stock criteria: current_stock <= 9
      const lowStock = allProducts.filter(p => p.current_stock <= 9);
      // Sort lowest stock first
      lowStock.sort((a, b) => a.current_stock - b.current_stock);

      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const handleUpdate = () => {
      refresh();
    };
    window.addEventListener('tari-mutations-updated', handleUpdate);
    return () => {
      window.removeEventListener('tari-mutations-updated', handleUpdate);
    };
  }, [refresh]);

  return {
    lowStockProducts,
    categoriesMap,
    loading,
    refresh,
    count: lowStockProducts.length,
  };
}
