import React, { useState } from 'react';
import { useReports, type ReportPeriod } from '../hooks/useReports';
import { PeriodFilter } from '../components/reports/PeriodFilter';
import { MetricCard } from '../components/reports/MetricCard';
import { BackupRestoreSection } from '../components/reports/BackupRestoreSection';
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters';
import { 
  DollarSign, 
  Database, 
  HardDrive, 
  ShoppingBag
} from 'lucide-react';

interface ReportsViewProps {
  onDataRestored?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onDataRestored }) => {
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>('today');
  
  // Custom date range state (YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);
  const sevenDaysAgoStr = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(sevenDaysAgoStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  const { summary, periodMutations, refresh } = useReports(activePeriod, startDate, endDate);

  const periodLabel = activePeriod === 'custom'
    ? (startDate && endDate ? `${formatDate(startDate)} s/d ${formatDate(endDate)}` : 'Rentang Kalender')
    : activePeriod === 'today' ? 'Hari Ini'
    : activePeriod === '7days' ? '7 Hari Terakhir'
    : activePeriod === 'month' ? 'Bulan Ini'
    : 'Semua Waktu';

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Sticky Period Filter */}
      <PeriodFilter
        currentPeriod={activePeriod}
        onPeriodChange={setActivePeriod}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* Finansial Cards */}
      <div className="px-4 mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard
            label="Omzet Penjualan"
            value={formatCurrency(summary.totalOutValue)}
            subValue={`${formatNumber(summary.totalOutQty)} unit keluar`}
            icon={<ShoppingBag className="w-4 h-4" />}
            colorScheme="orange"
          />

          <MetricCard
            label="Estimasi Laba Kotor"
            value={formatCurrency(summary.totalGrossProfit)}
            subValue={
              summary.totalOutValue > 0
                ? `${((summary.totalGrossProfit / summary.totalOutValue) * 100).toFixed(1)}% Margin`
                : '0% Margin'
            }
            icon={<DollarSign className="w-4 h-4" />}
            colorScheme="emerald"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard
            label="Belanja Modal"
            value={formatCurrency(summary.totalInValue)}
            subValue={`${formatNumber(summary.totalInQty)} unit masuk`}
            icon={<HardDrive className="w-4 h-4" />}
            colorScheme="red"
          />

          <MetricCard
            label="Net Arus Kas Kasir"
            value={formatCurrency(summary.netCashflowEstimate)}
            subValue="Omzet - Belanja Stok"
            icon={<Database className="w-4 h-4" />}
            colorScheme={summary.netCashflowEstimate >= 0 ? 'emerald' : 'slate'}
          />
        </div>

        {/* Transaction Volume Summary Box */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Volume & Mutasi Periode Terpilih
          </h3>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-orange-50/60 border border-orange-200/80">
              <span className="text-[10px] text-stone-600 block font-bold">Total Masuk</span>
              <span className="text-sm font-mono font-bold text-orange-700">
                +{formatNumber(summary.totalInQty)} <span className="text-[10px]">pcs</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-50/60 border border-red-200/80">
              <span className="text-[10px] text-stone-600 block font-bold">Total Keluar</span>
              <span className="text-sm font-mono font-bold text-red-700">
                -{formatNumber(summary.totalOutQty)} <span className="text-[10px]">pcs</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[10px] text-stone-600 block font-bold">Frekuensi</span>
              <span className="text-sm font-mono font-bold text-slate-900">
                {formatNumber(summary.mutationCount)} <span className="text-[10px]">kali</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backup, Restore & Reset Section */}
      <BackupRestoreSection
        periodLabel={periodLabel}
        startDate={activePeriod === 'custom' ? startDate : undefined}
        endDate={activePeriod === 'custom' ? endDate : undefined}
        mutations={periodMutations}
        onRefresh={refresh}
        onDataRestored={onDataRestored}
      />
    </div>
  );
};
