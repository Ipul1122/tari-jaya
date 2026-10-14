import { useState, useEffect } from 'react';
import { db } from '../../db/schema';
import type { Product } from '../../db/schema';
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
  ShoppingBag
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
  const [items, setItems] = useState<BulkItemEntry[]>([]);
  const [selectedToAddId, setSelectedToAddId] = useState<number>(0);
  const [allowNegative, setAllowNegative] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isStockIn = type === 'IN';

  // Sinkronisasi jika prop products berubah
  useEffect(() => {
    if (products.length > 0) {
      setAvailableProducts(products);
    }
  }, [products]);

  // Muat data produk terbaru langsung dari Dexie setiap kali drawer dibuka
  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setAllowNegative(false);

    const loadFreshProducts = async () => {
      // Selalu ambil produk paling mutakhir dari database IndexedDB
      const freshProducts = await db.products.orderBy('name').toArray();
      setAvailableProducts(freshProducts);

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
        if (freshProducts.length > 0) {
          setSelectedToAddId(freshProducts[0].id!);
        }
      } else if (freshProducts.length > 0) {
        const first = freshProducts[0];
        setItems([
          {
            productId: first.id!,
            product: first,
            quantity: 1,
            unitPrice: isStockIn ? first.cost_price : first.selling_price,
            notes: '',
          },
        ]);
        setSelectedToAddId(first.id!);
      } else {
        setItems([]);
        setSelectedToAddId(0);
      }
    };

    loadFreshProducts();
  }, [isOpen, type, selectedProduct, isStockIn]);

  if (!isOpen) return null;

  // Tambah produk ke daftar transaksi transaksi
  const handleAddProductToList = () => {
    const prodToAdd = availableProducts.find((p) => p.id === selectedToAddId);
    if (!prodToAdd) return;

    // Cek apakah produk sudah ada di daftar
    const existingIndex = items.findIndex((it) => it.productId === prodToAdd.id);
    if (existingIndex >= 0) {
      // Tambah kuantitas produk yang sudah ada
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      setItems(updated);
      showToast(`Jumlah "${prodToAdd.name}" ditambah menjadi ${updated[existingIndex].quantity}`, 'info');
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: prodToAdd.id!,
          product: prodToAdd,
          quantity: 1,
          unitPrice: isStockIn ? prodToAdd.cost_price : prodToAdd.selling_price,
          notes: '',
        },
      ]);
      showToast(`"${prodToAdd.name}" ditambahkan ke daftar`, 'success');
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

  // Check insufficient stocks
  const insufficientItems = !isStockIn
    ? items.filter((item) => item.quantity > item.product.current_stock)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      setError('Daftar barang masih kosong. Silakan tambahkan minimal 1 barang.');
      return;
    }

    if (!isStockIn && insufficientItems.length > 0 && !allowNegative) {
      setError(
        `Ada ${insufficientItems.length} barang yang kuantitasnya melebihi stok tersedia. Centang izin stok minus jika tetap ingin memproses.`
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
        showToast(`Berhasil mencatat stok masuk untuk ${items.length} macam barang`, 'success');
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
        showToast(`Berhasil mencatat stok keluar untuk ${items.length} macam barang`, 'success');
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-[#FAF8F5] border-t border-amber-200/80 rounded-t-3xl max-h-[94vh] flex flex-col shadow-2xl animate-slide-up pb-safe text-slate-900">
        {/* Drawer Pull Bar */}
        <div className="pt-3 pb-1 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 bg-white">
          <div className="flex items-center space-x-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                isStockIn ? 'bg-orange-500 shadow-orange-500/30' : 'bg-red-600 shadow-red-600/30'
              }`}
            >
              {isStockIn ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  {isStockIn ? 'Catat Barang Masuk (Bulk)' : 'Catat Barang Keluar (Bulk)'}
                </h2>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                  {items.length} Barang
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {isStockIn ? 'Kulakan beberapa barang sekaligus' : 'Penjualan beberapa item sekaligus'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:text-slate-900 hover:bg-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto px-4 py-3 space-y-3">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Selector: Tambah Barang ke Daftar */}
          <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              Pilih & Tambah Barang ke Daftar:
            </label>
            <div className="flex items-center gap-2">
              <select
                value={selectedToAddId}
                onChange={(e) => setSelectedToAddId(Number(e.target.value))}
                className="flex-1 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-slate-900 text-xs font-medium focus:outline-none focus:border-orange-500"
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok: {p.current_stock})
                  </option>
                ))}
              </select>

              {/* Text Button Add GREEN */}
              <button
                type="button"
                onClick={handleAddProductToList}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold text-xs flex items-center space-x-1.5 active:scale-95 transition shrink-0 min-h-[42px]"
              >
                <Plus className="w-4 h-4 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-700 font-bold">+ Tambah</span>
              </button>
            </div>
          </div>

          {/* List of Bulk Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Daftar Barang Transaksi ({items.length})
              </span>
              <span className="text-xs font-mono font-semibold text-stone-600">
                Total Qty: {formatNumber(totalVolumeQty)} unit
              </span>
            </div>

            {items.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-stone-200 text-center text-stone-500">
                <ShoppingBag className="w-8 h-8 text-stone-400 mx-auto mb-1" />
                <p className="text-xs font-medium">Belum ada barang di daftar transaksi.</p>
                <p className="text-[11px] text-stone-400">Pilih barang di atas lalu tekan tombol "+ Tambah".</p>
              </div>
            ) : (
              items.map((item, index) => {
                const isInsufficient = !isStockIn && item.quantity > item.product.current_stock;
                const subtotal = item.quantity * item.unitPrice;

                return (
                  <div
                    key={`${item.productId}-${index}`}
                    className={`p-3.5 rounded-2xl bg-white border shadow-sm transition space-y-2.5 ${
                      isInsufficient ? 'border-red-400 bg-red-50/40' : 'border-stone-200'
                    }`}
                  >
                    {/* Item Row Top: Name, Stock info, Delete button RED */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 leading-snug truncate">
                          {item.product.name}
                        </h4>
                        <span className="text-[11px] font-mono text-stone-600 block mt-0.5">
                          Sisa stok: <b>{formatNumber(item.product.current_stock)}</b> unit
                        </span>
                      </div>

                      {/* Text Button Delete RED */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-600 hover:text-red-700 font-bold text-xs p-1.5 rounded-lg hover:bg-red-50 flex items-center space-x-1 shrink-0 active:scale-95 transition"
                        title="Hapus barang ini dari daftar"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-red-600">Hapus</span>
                      </button>
                    </div>

                    {/* Quantity Stepper & Price Input Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 text-xs">
                      {/* Qty Stepper */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                          Jumlah (Qty):
                        </label>
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => updateItemQty(index, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-slate-900 font-bold flex items-center justify-center active:scale-95 transition"
                          >
                            <Minus className="w-3.5 h-3.5 text-slate-800" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQty(index, parseInt(e.target.value) || 1)
                            }
                            className="w-14 h-8 text-center rounded-lg bg-stone-50 border border-stone-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => updateItemQty(index, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-stone-200 border border-stone-300 text-slate-900 font-bold flex items-center justify-center active:scale-95 transition"
                          >
                            <Plus className="w-3.5 h-3.5 text-slate-800" />
                          </button>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                          {isStockIn ? 'Harga Modal (Rp):' : 'Harga Jual (Rp):'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-stone-400 select-none">
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
                            className="w-full h-8 pl-8 pr-2 rounded-lg bg-stone-50 border border-stone-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Subtotal & Notes */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100">
                      <input
                        type="text"
                        value={item.notes || ''}
                        onChange={(e) => updateItemNotes(index, e.target.value)}
                        placeholder="Catatan item (opsional)..."
                        className="flex-1 mr-2 px-2 py-1 bg-stone-50 border border-stone-200 rounded text-slate-800 text-[10px] focus:outline-none focus:border-orange-500"
                      />
                      <div className="text-right shrink-0">
                        <span className="text-stone-500 text-[10px]">Subtotal: </span>
                        <b className="font-mono text-slate-900 font-bold">{formatCurrency(subtotal)}</b>
                      </div>
                    </div>

                    {/* Warning if insufficient stock */}
                    {isInsufficient && (
                      <div className="p-2 rounded-lg bg-red-100/70 border border-red-300 text-red-800 text-[11px] flex items-center space-x-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Kuantitas melebihi stok yang ada ({item.product.current_stock} unit).</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
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

          {/* Financial Summary Card */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2 text-xs">
            <div className="flex justify-between items-center text-stone-600">
              <span className="font-medium">Total Jenis Barang:</span>
              <span className="font-mono font-bold text-slate-900">{items.length} macam</span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span className="font-medium">Total Kuantitas:</span>
              <span className="font-mono font-bold text-slate-900">{formatNumber(totalVolumeQty)} unit</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-stone-100">
              <span className="font-bold text-slate-900">
                {isStockIn ? 'Total Biaya Kulakan:' : 'Total Nilai Omzet:'}
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

          {/* Submit Button: Text Button Simpan BLUE */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0 || (insufficientItems.length > 0 && !allowNegative)}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 active:scale-[0.98] transition disabled:opacity-40 min-h-[48px]"
            >
              <Save className="w-4 h-4 text-white" />
              <span className="text-white font-bold">
                {isSubmitting
                  ? 'Menyimpan Semua Mutasi...'
                  : isStockIn
                  ? `Simpan Transaksi Masuk (${items.length} Barang)`
                  : `Simpan Transaksi Keluar (${items.length} Barang)`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
