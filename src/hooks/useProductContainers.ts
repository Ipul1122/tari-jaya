import { useMemo } from 'react';
import type { Product } from '../db/schema';
import type { ProductContainerGroup } from '../components/products/ProductContainerCard';

export type ProductSortOption = 
  | 'latest' 
  | 'name_asc' 
  | 'name_desc' 
  | 'stock_asc' 
  | 'stock_desc' 
  | 'price_asc' 
  | 'price_desc';

export function useProductContainers(products: Product[], sortBy: ProductSortOption) {
  return useMemo(() => {
    const groupsMap = new Map<string, ProductContainerGroup>();

    for (const prod of products) {
      const normalizedKey = prod.name.trim().toLowerCase();
      const existing = groupsMap.get(normalizedKey);

      if (existing) {
        existing.items.push(prod);
        existing.total_stock += prod.current_stock;
        if (new Date(prod.updated_at).getTime() > new Date(existing.latest_updated_at).getTime()) {
          existing.latest_updated_at = prod.updated_at;
        }
      } else {
        groupsMap.set(normalizedKey, {
          key: normalizedKey,
          name: prod.name.trim(),
          category_id: prod.category_id,
          total_stock: prod.current_stock,
          items: [prod],
          latest_updated_at: prod.updated_at,
        });
      }
    }

    const containerList = Array.from(groupsMap.values());

    switch (sortBy) {
      case 'name_asc':
        return containerList.sort((a, b) => a.name.localeCompare(b.name, 'id', { sensitivity: 'base' }));
      case 'name_desc':
        return containerList.sort((a, b) => b.name.localeCompare(a.name, 'id', { sensitivity: 'base' }));
      case 'stock_asc':
        return containerList.sort((a, b) => a.total_stock - b.total_stock);
      case 'stock_desc':
        return containerList.sort((a, b) => b.total_stock - a.total_stock);
      case 'price_asc':
        return containerList.sort((a, b) => {
          const minA = Math.min(...a.items.map((i) => i.selling_price));
          const minB = Math.min(...b.items.map((i) => i.selling_price));
          return minA - minB;
        });
      case 'price_desc':
        return containerList.sort((a, b) => {
          const maxA = Math.max(...a.items.map((i) => i.selling_price));
          const maxB = Math.max(...b.items.map((i) => i.selling_price));
          return maxB - maxA;
        });
      case 'latest':
      default:
        return containerList.sort(
          (a, b) => new Date(b.latest_updated_at).getTime() - new Date(a.latest_updated_at).getTime()
        );
    }
  }, [products, sortBy]);
}
