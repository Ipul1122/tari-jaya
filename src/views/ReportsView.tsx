import React, { useState } from 'react';
import { useReports } from '../hooks/useReports';
import type { ReportPeriod } from '../hooks/useReports';
import { PeriodFilter } from '../components/reports/PeriodFilter';
import { MetricCard } from '../components/reports/MetricCard';
import { exportDatabaseToJson, restoreDatabaseFromJson } from '../db/backup';
import { useToast } from '../components/common/Toast';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Download, 
  Upload, 
  Database, 
  HardDrive, 
  ShieldCheck,
  Trash2
} from 'lucide-react';
import logoTariJaya from '../assets/logo-tari-jaya.png';
import { PopoverConfirm } from '../components/common/PopoverConfirm';
import { clearAllDatabaseData } from '../db/schema';

interface ReportsViewProps {
  onDataRestored?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onDataRestored }) => {
  const { showToast } = useToast();
  const [activePeriod, setActivePeriod] = useState<ReportPeriod>('today');
  const { summary, refresh } = useReports(activePeriod);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState<boolean>(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>('');

  const handleResetAll = async () => {
    setConfirmResetOpen(false);
    try {
      await clearAllDatabaseData();
      showToast('Seluruh data berhasil dikosongkan. Database kembali bersih.', 'info');
      refresh();
      onDataRestored?.();
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengosongkan database', 'error');
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const filename = await exportDatabaseToJson();
      showToast(`Cadangan data berhasil diunduh: ${filename}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Gagal mengekspor data cadangan', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPendingFileContent(content);
      setRestoreConfirmOpen(true);
    };
    reader.onerror = () => {
      showToast('Gagal membaca file yang dipilih', 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingFileContent) return;

    try {
      setIsImporting(true);
      const result = await restoreDatabaseFromJson(pendingFileContent);
      showToast(
        `Data berhasil dipulihkan: ${result.productsCount} barang, ${result.mutationsCount} mutasi`,
        'success'
      );
      setRestoreConfirmOpen(false);
      setPendingFileContent(null);
      refresh();
      onDataRestored?.();
    } catch (err: any) {
      showToast(err?.message || 'Gagal memulihkan berkas cadangan', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-1 pb-24 overflow-y-auto">
      {/* Top Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-orange-600" />
            <h2 className="text-base font-bold text-slate-900">Laporan & Rekap Toko</h2>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
            Offline Analytics
          </span>
        </div>

        {/* Period Selector Tabs */}
        <PeriodFilter currentPeriod={activePeriod} onPeriodChange={setActivePeriod} />
      </div>

      {/* Financial Metrics Cards */}
      <div className="px-4 mt-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          <MetricCard
            label="Total Omzet Penjualan"
            value={formatCurrency(summary.totalOutValue)}
            subValue={`${formatNumber(summary.totalOutQty)} unit barang laku`}
            icon={<TrendingUp className="w-4 h-4" />}
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
            label="Belanja Masuk (Modal)"
            value={formatCurrency(summary.totalInValue)}
            subValue={`${formatNumber(summary.totalInQty)} unit kulakan`}
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

      {/* Backup, Restore & Data Portability Section (PRD F-07) */}
      <div className="px-4 mt-6">
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Cadangan & Pemulihan Mandiri</h3>
              <p className="text-xs text-stone-500">Data tersimpan 100% lokal di browser / HP Anda</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start space-x-2.5 text-xs text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed font-medium">
              File cadangan dapat dikirim via WhatsApp / Google Drive jika Anda ingin berpindah perangkat HP atau menyimpan arsip berkala.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="py-3 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition min-h-[44px]"
            >
              <Download className="w-4 h-4 text-orange-600" />
              <span>{isExporting ? 'Mengekspor...' : 'Export (.JSON)'}</span>
            </button>

            {/* Import Button with Popover Confirm */}
            <div className="relative">
              <label className="py-3 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition cursor-pointer min-h-[44px]">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Import Cadangan</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {/* Anchored Popover Confirmation */}
              <PopoverConfirm
                isOpen={restoreConfirmOpen}
                title="Pulihkan Data Cadangan?"
                description={`File: "${pendingFileName}". Peringatan: Seluruh data lokal saat ini akan ditimpa oleh data dari berkas cadangan ini.`}
                confirmLabel={isImporting ? 'Memulihkan...' : 'Ya, Pulihkan'}
                cancelLabel="Batalkan"
                variant="primary"
                position="top-right"
                onConfirm={handleConfirmRestore}
                onCancel={() => {
                  setRestoreConfirmOpen(false);
                  setPendingFileContent(null);
                }}
              />
            </div>
          </div>

          {/* Reset / Kosongkan Seluruh Data */}
          <div className="pt-2 border-t border-stone-200/80 flex justify-end relative">
            <button
              onClick={() => setConfirmResetOpen(!confirmResetOpen)}
              className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl flex items-center space-x-1.5 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Kosongkan Seluruh Data</span>
            </button>

            <PopoverConfirm
              isOpen={confirmResetOpen}
              title="Kosongkan Seluruh Data Toko?"
              description="Perhatian: Seluruh barang dan riwayat transaksi akan dihapus bersih dari perangkat. Hanya kategori default 'Umum' yang akan disisakan."
              confirmLabel="Ya, Kosongkan"
              cancelLabel="Batal"
              variant="danger"
              position="top-right"
              onConfirm={handleResetAll}
              onCancel={() => setConfirmResetOpen(false)}
            />
          </div>
        </div>

        {/* System & Architecture Info */}
        <div className="mt-4 p-3.5 rounded-2xl bg-white/70 border border-stone-200 flex items-center justify-center space-x-3 text-center">
          <img src={logoTariJaya} alt="Logo Tari Jaya" className="w-8 h-8 rounded-full border border-orange-200" />
          <div className="text-left">
            <p className="text-[11px] text-slate-900 font-bold">
              Tari Jaya Offline Stock Ledger &bull; Versi 1.0.0
            </p>
            <p className="text-[10px] text-stone-500 font-medium">
              Capacitor Android APK Ready &bull; IndexedDB Dexie Storage Engine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
