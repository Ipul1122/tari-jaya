import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../db/schema';
import type { Product, Category } from '../../db/schema';
import { recordBulkStockIn, recordBulkStockOut } from '../../db/operations';
import { formatCurrency, formatNumber, formatRupiahInput, parseRupiahInput } from '../../utils/formatters';
import { 
  X, 
  ArrowDownRight, 
  ArrowUpRight, 
  Plus, 
  Minus, 
  Trash2, 
  AlertTriangle, 
  AlertCircle, 
  Save, 
  ShoppingBag,
  Search,
  ChevronRight,
  ListPlus
} from 'lucide-react';
import { useToast } from '../common/Toast';

export interface BulkItemEntry {
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

interface QuickInOutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'IN' | 'OUT';
  selectedProduct?: Product | null;
  products: Product[];
  onSuccess: () => void;
}

export const QuickInOutDrawer: React.FC<QuickInOutDrawerProps> = ({
  isOpen,
  onClose,
  type,
  selectedProduct,
  products,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [availableProducts, setAvailableProducts] = useState<Product[]>(products);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<BulkItemEntry[]>([]);
  
  // UX State
  const [activeTab, setActiveTab] = useState<'select' | 'review'>('select');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'ALL'>('ALL');
  const [allowNegative, setAllowNegative] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isStockIn = type === 'IN';

  // Sync if prop products changes
  useEffect(() => {
    if (products.length > 0) {
      setAvailableProducts(products);
    }
  }, [products]);

  // Load latest data from Dexie whenever drawer is opened
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setAllowNegative(false);
    setSearchQuery('');
    setSelectedCategoryId('ALL');

    const loadFreshData = async () => {
      const [freshProducts, freshCategories] = await Promise.all([
        db.products.orderBy('name').toArray(),
        db.categories.toArray(),
      ]);
      setAvailableProducts(freshProducts);
      setCategories(freshCategories);

      if (selectedProduct) {
        const freshSelected = freshProducts.find((p) => p.id === selectedProduct.id) || selectedProduct;
        setItems([
          {
            productId: freshSelected.id!,
            product: freshSelected,
            quantity: 1,
            unitPrice: isStockIn ? freshSelected.cost_price : freshSelected.selling_price,
            notes: '',
          },
        ]);
        setActiveTab('review');
      } else {
        setItems([]);
        setActiveTab('select');
      }
    };

    loadFreshData();
  }, [isOpen, type, selectedProduct, isStockIn]);

  // Fast mapping of category names
  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categories.forEach((c) => {
      if (c.id) map.set(c.id, c.name);
    });
    return map;
  }, [categories]);

  // Filtered products list for "Pilih Barang" tab
  const filteredProducts = useMemo(() => {
    return availableProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesCategory =
        selectedCategoryId === 'ALL' || p.category_id === selectedCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [availableProducts, searchQuery, selectedCategoryId]);

  if (!isOpen) return null;

  // Cart operations (one-tap add, increment, decrement)
  const getItemQuantity = (productId: number): number => {
    const found = items.find((it) => it.productId === productId);
    return found ? found.quantity : 0;
  };

  const handleAddProduct = (prod: Product) => {
    const existingIndex = items.findIndex((it) => it.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: prod.id!,
          product: prod,
          quantity: 1,
          unitPrice: isStockIn ? prod.cost_price : prod.selling_price,
          notes: '',
        },
      ]);
      showToast(`"${prod.name}" ditambahkan`, 'info');
    }
  };

  const handleDecrementProduct = (productId: number) => {
    const existingIndex = items.findIndex((it) => it.productId === productId);
    if (existingIndex < 0) return;

    if (items[existingIndex].quantity <= 1) {
      // Remove item
      setItems((prev) => prev.filter((it) => it.productId !== productId));
    } else {
      const updated = [...items];
      updated[existingIndex].quantity -= 1;
      setItems(updated);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateItemQty = (index: number, newQty: number) => {
    const updated = [...items];
    updated[index].quantity = Math.max(1, newQty);
    setItems(updated);
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    const updated = [...items];
    updated[index].unitPrice = Math.max(0, newPrice);
    setItems(updated);
  };

  const updateItemNotes = (index: number, notes: string) => {
    const updated = [...items];
    updated[index].notes = notes;
    setItems(updated);
  };

  // Calculations
  const totalVolumeQty = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalFinancialAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const totalProfitEstimate = !isStockIn
    ? items.reduce(
        (sum, item) => sum + (item.unitPrice - item.product.cost_price) * item.quantity,
        0
      )
    : 0;

  // Check insufficient stocks for stock OUT
  const insufficientItems = !isStockIn
    ? items.filter((item) => item.quantity > item.product.current_stock)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError('Daftar transaksi masih kosong. Silakan pilih minimal 1 barang.');
      return;
    }

    if (!isStockIn && insufficientItems.length > 0 && !allowNegative) {
      setError(
        `Ada ${insufficientItems.length} barang yang kuantitasnya melebihi sisa stok toko. Centang izin stok minus jika tetap ingin memproses.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (isStockIn) {
        await recordBulkStockIn(
          items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitCost: it.unitPrice,
            notes: it.notes?.trim(),
          }))
        );
        showToast(`Berhasil mencatat barang masuk (${items.length} macam barang)`, 'success');
      } else {
        await recordBulkStockOut(
          items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            notes: it.notes?.trim(),
            allowNegativeStock: allowNegative,
          })),
          allowNegative
        );
        showToast(`Berhasil mencatat barang keluar (${items.length} macam barang)`, 'success');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan transaksi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-[#FAF8F5] border-t border-amber-200/80 rounded-t-3xl h-[92vh] max-h-[92vh] flex flex-col shadow-2xl animate-slide-up pb-safe text-slate-900">
        
        {/* Pull Handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-stone-200 bg-white shrink-0">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${
                isStockIn ? 'bg-orange-500 shadow-orange-500/20' : 'bg-red-600 shadow-red-600/20'
              }`}
            >
              {isStockIn ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {isStockIn ? 'Barang Masuk' : 'Barang Keluar'}
              </h2>
              <p className="text-[11px] text-stone-500">
                {isStockIn ? 'Pencatatan restock dan pasokan barang' : 'Pencatatan penjualan ke pelanggan'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-500 hover:text-slate-900 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modern Segmented Navigation Tabs */}
        <div className="px-4 pt-2.5 pb-1.5 bg-white border-b border-stone-200 shrink-0">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('select')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 min-h-[34px] ${
                activeTab === 'select'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-stone-500 hover:text-slate-800'
              }`}
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Pilih Barang</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 min-h-[34px] ${
                activeTab === 'review'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-stone-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Daftar Transaksi</span>
              {items.length > 0 && (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === 'review' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-stone-300 text-slate-800'
                }`}>
                  {items.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          {error && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: PILIH BARANG (Visual Fast Cart / POS Experience) */}
          {activeTab === 'select' && (
            <div className="space-y-3">
              {/* Search & Category Filter */}
              <div className="space-y-2">
                {/* Search Input */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama barang..."
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-stone-200 text-slate-900 text-xs focus:outline-none focus:border-orange-500 shadow-2xs font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-stone-400 hover:text-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Horizontal Category Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('ALL')}
                    className={`px-3 py-1 rounded-full shrink-0 font-medium transition ${
                      selectedCategoryId === 'ALL'
                        ? 'bg-orange-600 text-white font-bold shadow-2xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Semua ({availableProducts.length})
                  </button>
                  {categories.map((cat) => {
                    const count = availableProducts.filter((p) => p.category_id === cat.id).length;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategoryId(cat.id!)}
                        className={`px-3 py-1 rounded-full shrink-0 font-medium transition ${
                          selectedCategoryId === cat.id
                            ? 'bg-orange-600 text-white font-bold shadow-2xs'
                            : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        {cat.name} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Products Feed Grid */}
              <div className="space-y-2">
                {filteredProducts.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center text-stone-500">
                    <ShoppingBag className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">Tidak ada barang yang cocok</p>
                    <p className="text-[11px] text-stone-400 mt-1">Coba gunakan kata kunci atau kategori lain.</p>
                  </div>
                ) : (
                  filteredProducts.map((p) => {
                    const qtyInCart = getItemQuantity(p.id!);
                    const isSelected = qtyInCart > 0;
                    const categoryName = categoryMap.get(p.category_id) || 'Umum';
                    const displayPrice = isStockIn ? p.cost_price : p.selling_price;
                    const isLow = p.current_stock <= 9;

                    return (
                      <div
                        key={p.id}
                        className={`p-3 rounded-2xl border transition shadow-2xs flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-orange-50/40 border-orange-300'
                            : 'bg-white border-stone-200/90 hover:border-stone-300'
                        }`}
                      >
                        {/* Product Meta */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-1.5">
                            <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium shrink-0">
                              {categoryName}
                            </span>
                          </div>

                          <div className="flex items-center space-x-3 mt-1 text-[11px]">
                            <span className="font-mono font-bold text-slate-800">
                              {formatCurrency(displayPrice)}
                            </span>
                            <span className="text-stone-300">•</span>
                            <span
                              className={`font-mono text-[10px] font-semibold ${
                                isLow ? 'text-red-600 font-bold' : 'text-stone-600'
                              }`}
                            >
                              Stok: {formatNumber(p.current_stock)} unit
                            </span>
                          </div>
                        </div>

                        {/* Fast Tap Stepper / Add Button */}
                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="flex items-center space-x-1 bg-white border border-orange-300 rounded-xl p-0.5 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => handleDecrementProduct(p.id!)}
                                className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 text-slate-800 flex items-center justify-center font-bold active:scale-95 transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="w-7 text-center font-mono font-bold text-xs text-orange-700">
                                {qtyInCart}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddProduct(p)}
                                className="w-7 h-7 rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center font-bold active:scale-95 transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddProduct(p)}
                              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-orange-500 hover:text-white border border-stone-200 text-slate-800 font-bold text-xs flex items-center space-x-1 active:scale-95 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DAFTAR TRANSAKSI (Review, Custom Prices & Notes) */}
          {activeTab === 'review' && (
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center text-stone-500 space-y-3">
                  <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Daftar transaksi masih kosong</h4>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Silakan kembali ke tab "Pilih Barang" untuk memilih produk.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('select')}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs active:scale-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Pilih Barang Sekarang</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Detail Item Transaksi ({items.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('select')}
                      className="text-orange-600 hover:text-orange-700 font-bold text-[11px] flex items-center space-x-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Tambah Barang Lain</span>
                    </button>
                  </div>

                  {/* List of items */}
                  <div className="space-y-2.5">
                    {items.map((item, index) => {
                      const isInsufficient = !isStockIn && item.quantity > item.product.current_stock;
                      const subtotal = item.quantity * item.unitPrice;

                      return (
                        <div
                          key={`${item.productId}-${index}`}
                          className={`p-3 rounded-2xl bg-white border shadow-2xs space-y-2.5 ${
                            isInsufficient ? 'border-red-400 bg-red-50/30' : 'border-stone-200'
                          }`}
                        >
                          {/* Row 1: Item Name, Stock Info & Delete button */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate">
                                {item.product.name}
                              </h4>
                              <span className="text-[10px] font-mono text-stone-500 block">
                                Sisa stok: <b>{formatNumber(item.product.current_stock)}</b> unit
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-600 hover:text-red-700 font-bold text-xs p-1 rounded-lg hover:bg-red-50 flex items-center space-x-1 shrink-0 active:scale-95 transition"
                              title="Hapus barang"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Hapus</span>
                            </button>
                          </div>

                          {/* Row 2: Qty Stepper & Unit Price */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 text-xs">
                            <div>
                              <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                                Jumlah (Qty):
                              </label>
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(index, item.quantity - 1)}
                                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-slate-800 font-bold flex items-center justify-center active:scale-95 transition"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItemQty(index, parseInt(e.target.value) || 1)
                                  }
                                  className="w-12 h-7 text-center rounded-lg bg-stone-50 border border-stone-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-orange-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(index, item.quantity + 1)}
                                  className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-slate-800 font-bold flex items-center justify-center active:scale-95 transition"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-stone-600 mb-1">
                                {isStockIn ? 'Harga Modal (Rp):' : 'Harga Jual (Rp):'}
                              </label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-stone-400 select-none">
                                  Rp
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={item.unitPrice === 0 ? '' : formatRupiahInput(item.unitPrice)}
                                  onChange={(e) =>
                                    updateItemPrice(index, parseRupiahInput(e.target.value))
                                  }
                                  placeholder="0"
                                  className="w-full h-7 pl-7 pr-2 rounded-lg bg-stone-50 border border-stone-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-orange-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Row 3: Notes & Subtotal */}
                          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100">
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => updateItemNotes(index, e.target.value)}
                              placeholder="Catatan (opsional)..."
                              className="flex-1 mr-2 px-2 py-1 bg-stone-50 border border-stone-200 rounded-lg text-slate-800 text-[10px] focus:outline-none focus:border-orange-500"
                            />
                            <div className="text-right shrink-0">
                              <span className="text-stone-500 text-[10px]">Subtotal: </span>
                              <b className="font-mono text-slate-900 font-bold">{formatCurrency(subtotal)}</b>
                            </div>
                          </div>

                          {/* Warning if stock out > current stock */}
                          {isInsufficient && (
                            <div className="p-2 rounded-lg bg-red-100/80 border border-red-300 text-red-800 text-[11px] flex items-center space-x-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span>Kuantitas melebihi stok yang ada ({item.product.current_stock} unit).</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Insufficient Stock Confirmation */}
                  {insufficientItems.length > 0 && (
                    <div className="p-3 rounded-2xl bg-red-50 border border-red-300 text-red-900 text-xs space-y-2">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <b className="font-bold">Ada barang yang melebihi sisa stok toko!</b>
                          <p className="text-[11px] text-red-700 mt-0.5">
                            Total {insufficientItems.length} produk akan memiliki stok negatif jika diproses.
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center space-x-2 pt-1 border-t border-red-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowNegative}
                          onChange={(e) => setAllowNegative(e.target.checked)}
                          className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                        />
                        <span className="text-[11px] font-semibold text-red-800">
                          Saya sadar & izinkan stok minus sementara
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Financial Breakdown Card */}
                  <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-stone-600">
                      <span>Total Jenis Barang:</span>
                      <span className="font-mono font-bold text-slate-900">{items.length} macam</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-600">
                      <span>Total Kuantitas:</span>
                      <span className="font-mono font-bold text-slate-900">{formatNumber(totalVolumeQty)} unit</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-stone-100">
                      <span className="font-bold text-slate-900">
                        {isStockIn ? 'Total Biaya Masuk:' : 'Total Nilai Omzet:'}
                      </span>
                      <span className="font-mono font-bold text-base text-orange-600">
                        {formatCurrency(totalFinancialAmount)}
                      </span>
                    </div>
                    {!isStockIn && (
                      <div className="flex justify-between items-center pt-1 border-t border-stone-100">
                        <span className="font-bold text-slate-900">Estimasi Total Laba:</span>
                        <span className={`font-mono font-bold text-sm ${totalProfitEstimate >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {totalProfitEstimate >= 0 ? '+' : ''}{formatCurrency(totalProfitEstimate)}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sticky Bottom Action & Summary Bar */}
        <div className="p-3 bg-white border-t border-stone-200 shrink-0 space-y-2">
          {/* Summary Row */}
          <div className="flex items-center justify-between px-1">
            <div>
              <span className="text-[10px] text-stone-500 block font-medium">
                {items.length} Barang • {formatNumber(totalVolumeQty)} Unit
              </span>
              <span className="font-mono font-bold text-sm text-slate-900">
                {formatCurrency(totalFinancialAmount)}
              </span>
            </div>

            {/* Action Buttons */}
            {activeTab === 'select' ? (
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                disabled={items.length === 0}
                className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-orange-600/20 active:scale-95 transition disabled:opacity-40 min-h-[42px]"
              >
                <span>Tinjau Transaksi</span>
                <span className="bg-white/25 px-1.5 py-0.2 rounded-full font-mono text-[10px]">
                  {items.length}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || items.length === 0 || (insufficientItems.length > 0 && !allowNegative)}
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-2 shadow-md shadow-blue-600/25 active:scale-95 transition disabled:opacity-40 min-h-[42px]"
              >
                <Save className="w-4 h-4 text-white" />
                <span>
                  {isSubmitting
                    ? 'Menyimpan...'
                    : `Simpan Transaksi (${items.length})`}
                </span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
