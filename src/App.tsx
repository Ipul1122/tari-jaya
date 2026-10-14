import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import type { NavTab } from './components/layout/BottomNav';
import { DashboardView } from './views/DashboardView';
import { CatalogView } from './views/CatalogView';
import { HistoryView } from './views/HistoryView';
import { ReportsView } from './views/ReportsView';
import { QuickInOutDrawer } from './components/mutations/QuickInOutDrawer';
import { ToastProvider } from './components/common/Toast';
import { seedInitialDataIfNeeded } from './db/schema';
import type { Product } from './db/schema';
import { useProducts } from './hooks/useProducts';
import { useLowStock } from './hooks/useLowStock';

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerType, setDrawerType] = useState<'IN' | 'OUT'>('IN');
  const [drawerSelectedProduct, setDrawerSelectedProduct] = useState<Product | null>(null);

  const { products, refresh: refreshProducts } = useProducts();
  const { count: lowStockCount, refresh: refreshLowStock } = useLowStock();

  // Initialize offline seed data on first launch
  useEffect(() => {
    seedInitialDataIfNeeded().then(() => {
      refreshProducts();
      refreshLowStock();
    });
  }, []);

  // Refresh data whenever activeTab changes so changes across views are immediately reflected
  useEffect(() => {
    refreshProducts();
    refreshLowStock();
  }, [activeTab]);

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

  const handleMutationSuccess = () => {
    refreshProducts();
    refreshLowStock();
  };

  const handleDataRestored = () => {
    refreshProducts();
    refreshLowStock();
  };

  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Tari Jaya', subtitle: 'Dasbor Ringkasan Toko' },
    catalog: { title: 'Katalog Barang', subtitle: `${products.length} Jenis Produk Terdaftar` },
    history: { title: 'Riwayat Mutasi', subtitle: 'Audit Log Keluar & Masuk' },
    reports: { title: 'Laporan Finansial', subtitle: 'Kalkulasi Margin & Cadangan' },
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex justify-center">
      {/* Mobile Frame Container: max-w-md with Warm White background & Black text */}
      <div className="w-full max-w-md min-h-screen bg-[#FAF8F5] flex flex-col relative shadow-2xl border-x border-stone-200/80 text-slate-900">
        {/* App Top Header */}
        <Header
          title={titles[activeTab].title}
          subtitle={titles[activeTab].subtitle}
        />

        {/* View Switcher */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#FAF8F5]">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenStockIn={handleOpenStockIn}
              onOpenStockOut={handleOpenStockOut}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onSelectProduct={(p) => setDrawerSelectedProduct(p)}
            />
          )}

          {activeTab === 'catalog' && (
            <CatalogView
              onOpenStockIn={handleOpenStockIn}
              onOpenStockOut={handleOpenStockOut}
              onProductsChanged={() => {
                refreshProducts();
                refreshLowStock();
              }}
            />
          )}

          {activeTab === 'history' && <HistoryView />}

          {activeTab === 'reports' && (
            <ReportsView onDataRestored={handleDataRestored} />
          )}
        </main>

        {/* Bulk Quick In/Out Drawer */}
        <QuickInOutDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          type={drawerType}
          selectedProduct={drawerSelectedProduct}
          products={products}
          onSuccess={handleMutationSuccess}
        />

        {/* Fixed Mobile Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          lowStockCount={lowStockCount}
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
