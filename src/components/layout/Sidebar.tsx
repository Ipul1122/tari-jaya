import React, { useState, useEffect } from 'react';
import type { AppPage } from '../../types/navigation';
import logoTariJaya from '../../assets/logo-tari-jaya.png';
import {
  LayoutDashboard,
  BookOpenText,
  Boxes,
  BarChart3,
  X,
  ChevronDown,
  ArrowDownLeft,
  ArrowUpRight,
  PackagePlus,
  PackageMinus,
  History,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  lowStockCount?: number;
  activeDebtCount?: number;
  historyCount?: number;
}

interface SubMenuItem {
  page: AppPage;
  label: string;
  badgeText?: string;
  badgeClass?: string;
  count?: number;
  icon: React.ReactNode;
  activeBg: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activePage,
  onNavigate,
  lowStockCount = 0,
  activeDebtCount = 0,
  historyCount = 0,
}) => {
  const [isBarangOpen, setIsBarangOpen] = useState(true);
  const [isRiwayatOpen, setIsRiwayatOpen] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSelect = (page: AppPage) => {
    onNavigate(page);
    onClose();
  };

  if (!isOpen) return null;

  const barangItems: SubMenuItem[] = [
    { page: 'catalog', label: 'Katalog Master Barang', count: lowStockCount, icon: <Boxes className="w-4 h-4 text-stone-500" />, activeBg: 'bg-orange-100 text-orange-900 border-l-4 border-orange-500 font-bold' },
    { page: 'stock-in', label: '3.1 Barang Masuk', badgeText: 'Beli / Restock', badgeClass: 'text-rose-700 bg-rose-50 border-rose-200', icon: <PackagePlus className="w-4 h-4 text-rose-600" />, activeBg: 'bg-rose-100 text-rose-900 border-l-4 border-rose-600 font-bold' },
    { page: 'stock-out', label: '3.2 Barang Keluar', badgeText: 'Jual / Kasir', badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <PackageMinus className="w-4 h-4 text-emerald-600" />, activeBg: 'bg-emerald-100 text-emerald-900 border-l-4 border-emerald-600 font-bold' },
  ];

  const riwayatItems: SubMenuItem[] = [
    { page: 'history', label: 'Semua Log Mutasi', count: historyCount, icon: <History className="w-4 h-4 text-stone-500" />, activeBg: 'bg-orange-100 text-orange-900 border-l-4 border-orange-500 font-bold' },
    { page: 'history-in', label: '4.1 Riwayat Masuk', badgeText: 'Log Pembelian', badgeClass: 'text-rose-700 bg-rose-50 border-rose-200', icon: <ArrowDownLeft className="w-4 h-4 text-rose-600" />, activeBg: 'bg-rose-100 text-rose-900 border-l-4 border-rose-600 font-bold' },
    { page: 'history-out', label: '4.2 Riwayat Keluar', badgeText: 'Log Penjualan', badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <ArrowUpRight className="w-4 h-4 text-emerald-600" />, activeBg: 'bg-emerald-100 text-emerald-900 border-l-4 border-emerald-600 font-bold' },
  ];

  const renderGroup = (title: string, num: string, isOpen: boolean, onToggle: () => void, items: SubMenuItem[]) => (
    <div className="pt-1">
      <div className="flex items-center justify-between px-3.5 py-1.5 text-stone-400 uppercase tracking-wider text-[10px] font-extrabold">
        <div className="flex items-center space-x-2">
          <span className="w-4 h-4 rounded-full bg-stone-200/80 text-stone-700 flex items-center justify-center text-[10px]">{num}</span>
          <span className="text-stone-600 text-xs font-bold">{title}</span>
        </div>
        <button type="button" onClick={onToggle} className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100" aria-label={`Toggle Submenu ${title}`}>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {isOpen && (
        <div className="mt-1 space-y-1 pl-2">
          {items.map((item) => (
            <button
              key={item.page}
              onClick={() => handleSelect(item.page)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition min-h-[42px] ${
                activePage === item.page ? item.activeBg : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badgeText && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${item.badgeClass}`}>{item.badgeText}</span>}
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{item.count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity duration-300" onClick={onClose} aria-hidden="true" />
      <div className="relative w-80 max-w-[85vw] bg-[#FAF8F5] text-slate-900 h-full shadow-2xl flex flex-col z-10 border-r border-stone-200">
        <div className="p-4 border-b border-stone-200/90 bg-white flex items-center justify-between pt-safe">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-orange-200 bg-orange-50 flex items-center justify-center shrink-0">
              <img src={logoTariJaya} alt="Logo Tari Jaya" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-tight">Tari Jaya</h2>
              <p className="text-[11px] text-stone-500 font-medium">Toko Material & Bangunan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 -mr-1 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Tutup Menu Sidebar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-2 text-xs font-semibold">
          <button
            onClick={() => handleSelect('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition min-h-[46px] ${
              activePage === 'dashboard' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold ${activePage === 'dashboard' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'}`}>1</span>
              <LayoutDashboard className="w-4 h-4" />
              <span className="font-bold text-sm">Dashboard</span>
            </div>
          </button>

          <button
            onClick={() => handleSelect('debts')}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition min-h-[46px] ${
              activePage === 'debts' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold ${activePage === 'debts' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'}`}>2</span>
              <BookOpenText className="w-4 h-4" />
              <span className="font-bold text-sm">Piutang (Kasbon)</span>
            </div>
            {activeDebtCount > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activePage === 'debts' ? 'bg-white text-sky-800' : 'bg-red-500 text-white'}`}>
                {activeDebtCount}
              </span>
            )}
          </button>

          {renderGroup('Barang & Mutasi', '3', isBarangOpen, () => setIsBarangOpen(!isBarangOpen), barangItems)}
          {renderGroup('Riwayat Transaksi', '4', isRiwayatOpen, () => setIsRiwayatOpen(!isRiwayatOpen), riwayatItems)}

          <div className="pt-1">
            <button
              onClick={() => handleSelect('reports')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition min-h-[46px] ${
                activePage === 'reports' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold ${activePage === 'reports' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'}`}>5</span>
                <BarChart3 className="w-4 h-4" />
                <span className="font-bold text-sm">Laporan Finansial</span>
              </div>
            </button>
          </div>
        </nav>

        <div className="p-3 border-t border-stone-200 bg-stone-50/80 text-[11px] text-stone-500 text-center">
          <p className="font-semibold text-slate-700">Tari Jaya • Toko Material</p>
          <p className="text-[10px] text-stone-400 mt-0.5">Versi 1.1 • Stok & Piutang Material</p>
        </div>
      </div>
    </div>
  );
};
