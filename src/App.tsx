import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { BottomNav, type NavTab } from './components/layout/BottomNav';
import type { AppPage } from './types/navigation';
import { DashboardView } from './views/DashboardView';
import { CatalogView } from './views/CatalogView';
import { HistoryView } from './views/HistoryView';
import { DebtsView } from './views/DebtsView';
import { ReportsView } from './views/ReportsView';
import { StockInView } from './views/StockInView';
import { StockOutView } from './views/StockOutView';
import { QuickInOutDrawer } from './components/mutations/QuickInOutDrawer';
import { ProductModal } from './components/products/ProductModal';
import { ReceiptModal } from './components/receipt/ReceiptModal';
import type { ReceiptData } from './types/receipt';
import { ToastProvider } from './components/common/Toast';
import { seedInitialDataIfNeeded, type Product } from './db/schema';
import { createProduct } from './db/operations';
import { useProducts } from './hooks/useProducts';
import { useLowStock } from './hooks/useLowStock';
import { useDebts } from './hooks/useDebts';
import { useAppNotifications } from './hooks/useAppNotifications';

function getNavTabFromPage(page: AppPage): NavTab {
  if (page === 'debts') return 'debts';
  if (page === 'catalog' || page === 'stock-in' || page === 'stock-out') return 'catalog';
  if (page.startsWith('history')) return 'history';
  if (page === 'reports') return 'reports';
  return 'dashboard';
}

function MainApp() {
  const [activePage, setActivePage] = useState<AppPage>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'IN' | 'OUT'>('IN');
  const [drawerSelectedProduct, setDrawerSelectedProduct] = useState<Product | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addProductInitialName, setAddProductInitialName] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  const { products, refresh: refreshProducts } = useProducts();
  const { count: lowStockCount, refresh: refreshLowStock } = useLowStock();
  const { summary: debtSummary, refresh: refreshDebts } = useDebts();
  const {
    historyUnreadCount,
    debtsUnreadCount,
    lowStockUnreadCount,
    unreadMutationIds,
    markMutationAsRead,
    markAllMutationsAsRead,
    markTabAsRead,
    refreshNotifications,
  } = useAppNotifications(lowStockCount);

  const refreshAllData = useCallback(() => {
    refreshProducts();
    refreshLowStock();
    refreshDebts();
    refreshNotifications();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tari-mutations-updated'));
    }
  }, [refreshProducts, refreshLowStock, refreshDebts, refreshNotifications]);

  useEffect(() => {
    seedInitialDataIfNeeded().then(refreshAllData);
  }, [refreshAllData]);

  useEffect(() => {
    refreshAllData();
  }, [activePage, refreshAllData]);

  const handlePageChange = (page: AppPage) => {
    setActivePage(page);
    markTabAsRead(getNavTabFromPage(page));
  };

  const handleTabChange = (tab: NavTab) => {
    setActivePage(tab);
    markTabAsRead(tab);
  };

  const handleOpenStockIn = (product?: Product) => {
    refreshProducts();
    setDrawerType('IN');
    setDrawerSelectedProduct(product || null);
    setDrawerOpen(true);
  };

  const handleOpenStockOut = (product?: Product) => {
    refreshProducts();
    setDrawerType('OUT');
    setDrawerSelectedProduct(product || null);
    setDrawerOpen(true);
  };

  const handleOpenAddProduct = (name: string = '') => {
    setAddProductInitialName(name);
    setAddProductOpen(true);
  };

  const handleSaveProduct = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const id = await createProduct(data);
    const now = new Date().toISOString();
    const newProd: Product = { ...data, id, created_at: now, updated_at: now };
    refreshAllData();
    if (drawerOpen) {
      setDrawerSelectedProduct(newProd);
    }
  };

  const titles: Record<AppPage, { title: string; subtitle: string }> = {
    dashboard: { title: 'Tari Jaya', subtitle: 'Toko Material & Bahan Bangunan' },
    debts: { title: 'Buku Piutang (Kasbon)', subtitle: `${debtSummary.activeReceivableCount} Kasbon Belum Lunas` },
    catalog: { title: 'Katalog Material', subtitle: `${products.length} Jenis Material Terdaftar` },
    'stock-in': { title: '3.1 Barang Masuk', subtitle: 'Penerimaan Stok & Kulakan Material' },
    'stock-out': { title: '3.2 Barang Keluar', subtitle: 'Penjualan Material & Proyek' },
    history: { title: 'Semua Riwayat Mutasi', subtitle: 'Audit Log Keluar & Masuk' },
    'history-in': { title: '4.1 Riwayat Masuk', subtitle: 'Audit Log Pembelian Material' },
    'history-out': { title: '4.2 Riwayat Keluar', subtitle: 'Audit Log Penjualan Material' },
    reports: { title: 'Laporan Finansial', subtitle: 'Kalkulasi Margin & Cadangan' },
  };

  const activeTab = getNavTabFromPage(activePage);

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex justify-center">
      <div className="w-full max-w-md min-h-screen bg-[#FAF8F5] flex flex-col relative shadow-2xl border-x border-stone-200/80 text-slate-900">
        <Header
          title={titles[activePage].title}
          subtitle={titles[activePage].subtitle}
          activePage={activePage}
          onNavigate={handlePageChange}
          lowStockCount={lowStockUnreadCount}
          activeDebtCount={debtsUnreadCount}
          historyCount={historyUnreadCount}
        />

        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#FAF8F5]">
          {activePage === 'dashboard' && (
            <DashboardView
              onOpenStockIn={handleOpenStockIn}
              onOpenStockOut={handleOpenStockOut}
              onNavigateToTab={(tab) => handlePageChange(tab)}
              onSelectProduct={(p) => setDrawerSelectedProduct(p)}
              onOpenAddProduct={handleOpenAddProduct}
              onViewReceipt={(receipt) => setActiveReceipt(receipt)}
              productsCount={products.length}
            />
          )}

          {activePage === 'debts' && <DebtsView />}

          {activePage === 'catalog' && (
            <CatalogView
              onOpenStockIn={handleOpenStockIn}
              onOpenStockOut={handleOpenStockOut}
              onProductsChanged={refreshAllData}
            />
          )}

          {activePage === 'stock-in' && (
            <StockInView
              onOpenStockIn={handleOpenStockIn}
              onNavigateToHistoryIn={() => handlePageChange('history-in')}
            />
          )}

          {activePage === 'stock-out' && (
            <StockOutView
              onOpenStockOut={handleOpenStockOut}
              onNavigateToHistoryOut={() => handlePageChange('history-out')}
            />
          )}

          {activePage === 'history' && (
            <HistoryView
              unreadMutationIds={unreadMutationIds}
              onMarkMutationAsRead={markMutationAsRead}
              onMarkAllAsRead={markAllMutationsAsRead}
              initialFilterType="ALL"
              onViewReceipt={(receipt) => setActiveReceipt(receipt)}
            />
          )}

          {activePage === 'history-in' && (
            <HistoryView
              unreadMutationIds={unreadMutationIds}
              onMarkMutationAsRead={markMutationAsRead}
              onMarkAllAsRead={markAllMutationsAsRead}
              initialFilterType="IN"
              lockedFilterType="IN"
            />
          )}

          {activePage === 'history-out' && (
            <HistoryView
              unreadMutationIds={unreadMutationIds}
              onMarkMutationAsRead={markMutationAsRead}
              onMarkAllAsRead={markAllMutationsAsRead}
              initialFilterType="OUT"
              lockedFilterType="OUT"
              onViewReceipt={(receipt) => setActiveReceipt(receipt)}
            />
          )}

          {activePage === 'reports' && <ReportsView onDataRestored={refreshAllData} />}
        </main>

        <QuickInOutDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          type={drawerType}
          selectedProduct={drawerSelectedProduct}
          products={products}
          onSuccess={(receipt) => {
            refreshAllData();
            if (receipt) setActiveReceipt(receipt);
          }}
          onSwitchType={(type) => setDrawerType(type)}
          onNavigateToHistory={() => {
            handlePageChange('history');
            refreshNotifications();
          }}
          onOpenAddNewProduct={(name) => handleOpenAddProduct(name)}
        />

        <ProductModal
          isOpen={addProductOpen}
          onClose={() => setAddProductOpen(false)}
          onSave={handleSaveProduct}
          initialName={addProductInitialName}
          existingProducts={products}
        />

        <ReceiptModal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          receipt={activeReceipt}
        />

        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          lowStockCount={lowStockUnreadCount}
          activeDebtCount={debtsUnreadCount}
          historyCount={historyUnreadCount}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
