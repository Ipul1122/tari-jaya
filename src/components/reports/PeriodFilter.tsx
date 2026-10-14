import React from 'react';
import type { ReportPeriod } from '../../hooks/useReports';
import { Calendar } from 'lucide-react';

interface PeriodFilterProps {
  currentPeriod: ReportPeriod;
  onPeriodChange: (period: ReportPeriod) => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
}

export const PeriodFilter: React.FC<PeriodFilterProps> = ({
  currentPeriod,
  onPeriodChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const options: { id: ReportPeriod; label: string }[] = [
    { id: 'today', label: 'Hari Ini' },
    { id: '7days', label: '7 Hari' },
    { id: 'month', label: 'Bulan Ini' },
    { id: 'custom', label: 'Kalender' },
    { id: 'all', label: 'Semua' },
  ];

  return (
    <div className="space-y-2">
      <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 overflow-x-auto no-scrollbar gap-1">
        {options.map((opt) => {
          const isActive = currentPeriod === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onPeriodChange(opt.id)}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 min-h-[36px] flex items-center justify-center space-x-1 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 font-bold'
                  : 'text-stone-600 hover:text-slate-900 active:bg-stone-200'
              }`}
            >
              {opt.id === 'custom' && <Calendar className="w-3.5 h-3.5 shrink-0" />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Date Pickers for Custom Calendar Range */}
      {currentPeriod === 'custom' && (
        <div className="p-3 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2 animate-fade-in text-xs">
          <div className="flex items-center space-x-1.5 text-stone-700 font-bold text-xs">
            <Calendar className="w-4 h-4 text-orange-600" />
            <span>Pilih Rentang Tanggal Kalender</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Dari Tanggal:
              </label>
              <input
                type="date"
                value={startDate || ''}
                onChange={(e) => onStartDateChange?.(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-orange-500 min-h-[36px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Sampai Tanggal:
              </label>
              <input
                type="date"
                value={endDate || ''}
                onChange={(e) => onEndDateChange?.(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-300 text-slate-900 font-mono text-xs focus:outline-none focus:border-orange-500 min-h-[36px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
