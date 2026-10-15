import { useState, useMemo } from 'react';
import type { Product } from '../../db/schema';
import type { BulkItemEntry } from './QuickInOutDrawer';
import { useToast } from '../common/Toast';

export function useDrawerCart(isStockIn: boolean, allowNegative: boolean) {
  const { showToast } = useToast();
  const [items, setItems] = useState<BulkItemEntry[]>([]);

  const cartItemMap = useMemo(() => {
    const map = new Map<number, number>();
    items.forEach((item) => {
      map.set(item.productId, (map.get(item.productId) || 0) + item.quantity);
    });
    return map;
  }, [items]);

  const totalUnits = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalValue = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [items]);

  const handleAddProduct = (prod: Product) => {
    const defaultPrice = isStockIn ? prod.cost_price : prod.selling_price;
    const existingIndex = items.findIndex((i) => i.productId === prod.id);

    if (existingIndex >= 0) {
      const current = items[existingIndex];
      if (!isStockIn && !allowNegative && current.quantity >= prod.current_stock) {
        showToast(`Stok "${prod.name}" hanya tersedia ${prod.current_stock} unit`, 'error');
        return;
      }
      const updated = [...items];
      updated[existingIndex] = { ...current, quantity: current.quantity + 1 };
      setItems(updated);
    } else {
      if (!isStockIn && !allowNegative && prod.current_stock <= 0) {
        showToast(`Stok "${prod.name}" sedang habis`, 'error');
        return;
      }
      setItems([...items, { productId: prod.id!, product: prod, quantity: 1, unitPrice: defaultPrice, notes: '' }]);
    }
  };

  const handleDecrementProduct = (prodId: number) => {
    const existingIndex = items.findIndex((i) => i.productId === prodId);
    if (existingIndex < 0) return;

    const current = items[existingIndex];
    if (current.quantity > 1) {
      const updated = [...items];
      updated[existingIndex] = { ...current, quantity: current.quantity - 1 };
      setItems(updated);
    } else {
      setItems(items.filter((_, idx) => idx !== existingIndex));
    }
  };

  const handleDirectQuantityChange = (prod: Product, value: string) => {
    const rawVal = value.replace(/\D/g, '');
    const num = rawVal === '' ? 0 : parseInt(rawVal, 10);
    const existingIndex = items.findIndex((i) => i.productId === prod.id);

    if (existingIndex < 0) {
      if (num > 0) {
        const clamped = (!isStockIn && !allowNegative && num > prod.current_stock) ? prod.current_stock : num;
        setItems([...items, {
          productId: prod.id!,
          product: prod,
          quantity: clamped,
          unitPrice: isStockIn ? prod.cost_price : prod.selling_price,
          notes: '',
        }]);
      }
      return;
    }

    const updated = [...items];
    if (num <= 0) {
      updated[existingIndex] = { ...updated[existingIndex], quantity: 0 };
    } else {
      const clamped = (!isStockIn && !allowNegative && num > prod.current_stock) ? prod.current_stock : num;
      updated[existingIndex] = { ...updated[existingIndex], quantity: clamped };
    }
    setItems(updated);
  };

  const handleInputBlur = (prodId: number) => {
    const target = items.find((i) => i.productId === prodId);
    if (target && target.quantity <= 0) {
      setItems(items.filter((i) => i.productId !== prodId));
    }
  };

  const updateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setItems(items.filter((_, idx) => idx !== index));
      return;
    }
    const current = items[index];
    const clamped = (!isStockIn && !allowNegative && newQty > current.product.current_stock)
      ? current.product.current_stock
      : newQty;
    const updated = [...items];
    updated[index] = { ...current, quantity: clamped };
    setItems(updated);
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], unitPrice: Math.max(0, newPrice) };
    setItems(updated);
  };

  const updateItemNotes = (index: number, notes: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], notes };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  return {
    items,
    setItems,
    cartItemMap,
    totalUnits,
    totalValue,
    handleAddProduct,
    handleDecrementProduct,
    handleDirectQuantityChange,
    handleInputBlur,
    updateItemQty,
    updateItemPrice,
    updateItemNotes,
    handleRemoveItem,
  };
}
