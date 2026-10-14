import React from 'react';
import type { ReportPeriod } from '../../hooks/useReports';

interface PeriodFilterProps {
  currentPeriod: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  currentPeriod,
  onPeriodChange,
}) => {
  const options: { id: ReportPeriod; label: string }[] = [
    { id: 'today', label: 'Hari Ini' },
    { id: '7days', label: '7 Hari' },
    { id: 'month', label: 'Bulan Ini' },
    { id: 'year', label: 'Tahun Ini' },
    { id: 'all', label: 'Semua' },
  ];

  return (
    <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto no-scrollbar">
      {options.map((opt) => {
        const isActive = currentPeriod === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onPeriodChange(opt.id)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 min-h-[36px] ${
              isActive
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold'
                : 'text-stone-600 hover:text-slate-900 active:bg-stone-200'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
