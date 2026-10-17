import React, { useState } from 'react';
import logoTariJaya from '../../assets/logo-tari-jaya.png';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import type { AppPage } from '../../types/navigation';

export interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  activePage?: AppPage;
  onNavigate?: (page: AppPage) => void;
  lowStockCount?: number;
  activeDebtCount?: number;
  historyCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Tari Jaya',
  subtitle = 'Toko Material & Bahan Bangunan',
  rightAction,
  activePage = 'dashboard',
  onNavigate,
  lowStockCount = 0,
  activeDebtCount = 0,
  historyCount = 0,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200/90 text-slate-900 px-3 py-2 shadow-sm pt-safe">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Sidebar Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-1 rounded-xl text-stone-700 hover:text-orange-600 hover:bg-orange-50 active:scale-95 transition min-w-[44px] min-h-[44px] flex items-center justify-center border border-stone-200/70"
              aria-label="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>

            {/* Logo Tari Jaya Image */}
            <div className="w-9 h-9 rounded-full overflow-hidden shadow-xs border border-orange-200 shrink-0 bg-orange-50 flex items-center justify-center">
              <img
                src={logoTariJaya}
                alt="Logo Tari Jaya"
                className="w-full h-full object-contain"
              />
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 line-clamp-1">{title}</h1>
              </div>
              <p className="text-[11px] text-stone-500 font-medium truncate max-w-[190px]">{subtitle}</p>
            </div>
          </div>

          {rightAction && <div className="flex items-center space-x-2">{rightAction}</div>}
        </div>
      </header>

      {/* Sidebar Drawer */}
      {onNavigate && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activePage={activePage}
          onNavigate={onNavigate}
          lowStockCount={lowStockCount}
          activeDebtCount={activeDebtCount}
          historyCount={historyCount}
        />
      )}
    </>
  );
};
