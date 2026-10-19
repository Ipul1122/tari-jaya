import React, { useState } from 'react';
import { exportReportsToExcel } from '../../utils/exportExcel';
import { restoreDatabaseFromExcel } from '../../utils/excelRestore';
import { restoreDatabaseFromJson } from '../../db/backup';
import { db, clearAllDatabaseData, type StockMutation } from '../../db/schema';
import { useToast } from '../common/Toast';
import { PopoverConfirm } from '../common/PopoverConfirm';
import { ExcelExportPeriodModal, type ExportPeriodConfig } from './ExcelExportPeriodModal';
import logoTariJaya from '../../assets/logo-tari-jaya.png';
import { 
  FileSpreadsheet, 
  Upload, 
  Database, 
  ShieldCheck, 
  Trash2 
} from 'lucide-react';

interface BackupRestoreSectionProps {
  periodLabel: string;
  startDate?: string;
  endDate?: string;
  mutations: StockMutation[];
  onRefresh: () => void;
  onDataRestored?: () => void;
}

export const BackupRestoreSection: React.FC<BackupRestoreSectionProps> = ({
  periodLabel: _periodLabel,
  startDate: _startDate,
  endDate: _endDate,
  mutations: _mutations,
  onRefresh,
  onDataRestored,
}) => {
  const { showToast } = useToast();
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState<boolean>(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleResetAll = async () => {
    setConfirmResetOpen(false);
    try {
      await clearAllDatabaseData();
      showToast('Seluruh data toko berhasil dikosongkan. Database kembali bersih.', 'info');
      onRefresh();
      onDataRestored?.();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal mengosongkan database', 'error');
    }
  };

  const handleConfirmExportPeriod = async (config: ExportPeriodConfig) => {
    try {
      setIsExportingExcel(true);
      let targetMutations = await db.stock_mutations.toArray();

      if (config.startDate) {
        const start = `${config.startDate}T00:00:00.000Z`;
        const end = config.endDate ? `${config.endDate}T23:59:59.999Z` : '';
        targetMutations = targetMutations.filter((m) => {
          if (config.key === 'LAST_4_6_MONTHS') {
            return m.timestamp >= start && m.timestamp < end;
          }
          return m.timestamp >= start;
        });
      }

      const filename = await exportReportsToExcel({
        periodLabel: config.label,
        startDate: config.startDate,
        endDate: config.endDate,
        mutations: targetMutations,
      });

      setIsExportModalOpen(false);
      showToast(`File Excel (${config.label}) berhasil diunduh: ${filename}`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal mengekspor data ke Excel', 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setRestoreConfirmOpen(true);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingFile) return;

    try {
      setIsImporting(true);
      if (pendingFile.name.toLowerCase().endsWith('.json')) {
        const text = await pendingFile.text();
        await restoreDatabaseFromJson(text);
        showToast('Data toko berhasil dipulihkan!', 'success');
      } else {
        const res = await restoreDatabaseFromExcel(pendingFile);
        showToast(`Berhasil memulihkan: ${res.productsCount} material, ${res.debtsCount} piutang, ${res.mutationsCount} transaksi!`, 'success');
      }

      setRestoreConfirmOpen(false);
      setPendingFile(null);
      onRefresh();
      onDataRestored?.();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Gagal memulihkan data dari Excel', 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="px-4 mt-6">
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cadangan & Pemulihan Excel</h3>
            <p className="text-xs text-stone-500">Data tersimpan 100% offline dan aman di HP Anda</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start space-x-2.5 text-xs text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed font-medium text-emerald-950">
            Anda dapat mengunduh seluruh data toko ke file Excel (.xlsx), atau memulihkan kembali data material, piutang, dan riwayat langsung dari file Excel.
          </p>
        </div>

        {/* 2 Main Action Buttons: Export Excel and Restore Excel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Download Excel */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={isExportingExcel}
            className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm active:scale-95 transition min-h-[46px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            <span>{isExportingExcel ? 'Mengunduh...' : 'Unduh Data Toko ke Excel (.xlsx)'}</span>
          </button>

          {/* Restore Excel */}
          <div className="relative">
            <label className="w-full py-3 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition cursor-pointer min-h-[46px]">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Pulihkan Data dari Excel (.xlsx)</span>
              <input
                type="file"
                accept=".xlsx,.xls,.json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            <PopoverConfirm
              isOpen={restoreConfirmOpen}
              title="Pulihkan Data Toko?"
              description={`File: "${pendingFile?.name || ''}". Data material, piutang, dan transaksi akan dipulihkan dari file Excel ini.`}
              confirmLabel={isImporting ? 'Memulihkan...' : 'Ya, Pulihkan Sekarang'}
              cancelLabel="Batalkan"
              variant="primary"
              position="top-right"
              onConfirm={handleConfirmRestore}
              onCancel={() => {
                setRestoreConfirmOpen(false);
                setPendingFile(null);
              }}
            />
          </div>
        </div>

        {/* Reset / Kosongkan Data */}
        <div className="pt-2 border-t border-stone-200/80 flex justify-end relative">
          <button
            onClick={() => setConfirmResetOpen(!confirmResetOpen)}
            className="px-3 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl flex items-center space-x-1.5 transition active:scale-95 min-h-[44px]"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Kosongkan Seluruh Data</span>
          </button>

          <PopoverConfirm
            isOpen={confirmResetOpen}
            title="Kosongkan Seluruh Data Toko?"
            description="Perhatian: Seluruh barang, piutang kasbon, dan riwayat transaksi akan dihapus bersih."
            confirmLabel="Ya, Kosongkan"
            cancelLabel="Batal"
            variant="danger"
            position="top-right"
            onConfirm={handleResetAll}
            onCancel={() => setConfirmResetOpen(false)}
          />
        </div>
      </div>

      {/* System Logo & Info */}
      <div className="mt-4 p-3.5 rounded-2xl bg-white/70 border border-stone-200 flex items-center justify-center space-x-3 text-center">
        <img src={logoTariJaya} alt="Logo Tari Jaya" className="w-8 h-8 rounded-full border border-orange-200" />
        <div className="text-left">
          <p className="text-[11px] text-slate-900 font-bold">
            Tari Jaya Offline Stock Ledger &bull; Versi 1.1.0
          </p>
          <p className="text-[10px] text-stone-500 font-medium">
            Capacitor Android APK Ready &bull; IndexedDB Dexie v2
          </p>
        </div>
      </div>

      <ExcelExportPeriodModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirmExport={handleConfirmExportPeriod}
        isExporting={isExportingExcel}
      />
    </div>
  );
};
