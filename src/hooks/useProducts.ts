import { useState, useEffect, useCallback } from 'react';
import { db } from '../db/schema';
import type { Product, Category } from '../db/schema';

export function useProducts(selectedCategoryId?: number | null, searchQuery: string = '') {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    try {
      const [allCats, rawProds] = await Promise.all([
        db.categories.toArray(),
        db.products.toArray(),
      ]);

      setCategories(allCats);
      setAllProducts(rawProds);

      let filtered = [...rawProds];
      if (selectedCategoryId) {
        filtered = filtered.filter(p => p.category_id === selectedCategoryId);
      }

      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.notes && p.notes.toLowerCase().includes(query))
        );
      }

      // Default sort by updated_at desc
      filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      setProducts(filtered);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, searchQuery]);

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
    products,
    allProducts,
    categories,
    loading,
    refresh,
  };
}
