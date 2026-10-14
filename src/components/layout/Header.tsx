import React from 'react';
import logoTariJaya from '../../assets/logo-tari-jaya.png';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Tari Jaya',
  subtitle = 'Inventory & Stock Ledger',
  rightAction,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200/90 text-slate-900 px-4 py-2.5 shadow-sm pt-safe">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          {/* Logo Tari Jaya Image */}
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-sm border border-orange-200 shrink-0 bg-orange-50 flex items-center justify-center">
            <img
              src={logoTariJaya}
              alt="Logo Tari Jaya"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900">{title}</h1>
              
            </div>
            <p className="text-xs text-stone-500 font-medium truncate max-w-[200px]">{subtitle}</p>
          </div>
        </div>

        {rightAction && <div className="flex items-center space-x-2">{rightAction}</div>}
      </div>
    </header>
  );
};
