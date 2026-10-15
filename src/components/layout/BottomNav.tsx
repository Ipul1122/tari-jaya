import React from 'react';
import { LayoutDashboard, Boxes, ArrowLeftRight, BookOpenText, BarChart3 } from 'lucide-react';

export type NavTab = 'dashboard' | 'debts' | 'catalog' | 'history' | 'reports';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  lowStockCount?: number;
  activeDebtCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  lowStockCount = 0,
  activeDebtCount = 0,
}) => {
  const tabs = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'debts' as NavTab,
      label: 'Hutang',
      icon: BookOpenText,
      badge: activeDebtCount > 0 ? activeDebtCount : undefined,
    },
    {
      id: 'catalog' as NavTab,
      label: 'Barang',
      icon: Boxes,
      isPrimary: true,
    },
    {
      id: 'history' as NavTab,
      label: 'Riwayat',
      icon: ArrowLeftRight,
    },
    {
      id: 'reports' as NavTab,
      label: 'Laporan',
      icon: BarChart3,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 pb-safe shadow-xl">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-1.5 items-end">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-end pb-1 -mt-5 group select-none active:scale-95 transition-transform"
                aria-label={tab.label}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 border-4 border-white ${
                    isActive
                      ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-orange-500/40 ring-2 ring-orange-400 scale-105'
                      : 'bg-orange-500 text-white shadow-orange-500/25 hover:bg-orange-600'
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span
                  className={`text-[10px] mt-1 tracking-tight font-bold transition-colors ${
                    isActive ? 'text-orange-600' : 'text-stone-600'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 min-h-[52px] select-none ${
                isActive
                  ? 'text-orange-600 font-bold'
                  : 'text-stone-500 hover:text-slate-900 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-orange-600' : 'text-stone-500'
                  }`}
                />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'text-orange-600 font-bold' : 'text-stone-500 font-medium'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-orange-600 animate-fade-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
