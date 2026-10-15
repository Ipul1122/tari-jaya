import React, { useState } from 'react';
import { exportDatabaseToJson, restoreDatabaseFromJson } from '../../db/backup';
import { exportReportsToExcel } from '../../utils/exportExcel';
import { clearAllDatabaseData, type StockMutation } from '../../db/schema';
import { useToast } from '../common/Toast';
import { PopoverConfirm } from '../common/PopoverConfirm';
import logoTariJaya from '../../assets/logo-tari-jaya.png';
import { 
  Download, 
  Upload, 
  Database, 
  ShieldCheck, 
  Trash2, 
  FileSpreadsheet 
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
  periodLabel,
  startDate,
  endDate,
  mutations,
  onRefresh,
  onDataRestored,
}) => {
  const { showToast } = useToast();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
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
      onRefresh();
      onDataRestored?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengosongkan database';
      showToast(msg, 'error');
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const filename = await exportDatabaseToJson();
      showToast(`Cadangan data berhasil diunduh: ${filename}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengekspor data cadangan';
      showToast(msg, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const filename = await exportReportsToExcel({
        periodLabel,
        startDate,
        endDate,
        mutations,
      });
      showToast(`File Excel berhasil diunduh: ${filename}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengekspor data ke Excel';
      showToast(msg, 'error');
    } finally {
      setIsExportingExcel(false);
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
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!pendingFileContent) return;

    try {
      setIsImporting(true);
      await restoreDatabaseFromJson(pendingFileContent);
      showToast('Data berhasil dipulihkan dari berkas cadangan!', 'success');
      setRestoreConfirmOpen(false);
      setPendingFileContent(null);
      onRefresh();
      onDataRestored?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memulihkan cadangan';
      showToast(msg, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="px-4 mt-6">
      <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cadangan & Pemulihan Mandiri</h3>
            <p className="text-xs text-stone-500">Data tersimpan 100% lokal di HP Anda</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start space-x-2.5 text-xs text-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed font-medium">
            File cadangan dapat dikirim via WhatsApp / Google Drive jika Anda ingin berpindah perangkat HP atau menyimpan arsip berkala.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="py-3 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition min-h-[44px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isExportingExcel ? 'Mengunduh...' : 'Export Excel (.xlsx)'}</span>
          </button>

          {/* Export JSON Button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="py-3 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-300 text-slate-800 font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition min-h-[44px]"
          >
            <Download className="w-4 h-4 text-orange-600" />
            <span>{isExporting ? 'Mengekspor...' : 'Backup (.JSON)'}</span>
          </button>
        </div>

        {/* Import Button */}
        <div className="pt-1">
          <div className="relative">
            <label className="w-full py-3 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-700 font-bold text-xs flex items-center justify-center space-x-2 active:scale-95 transition cursor-pointer min-h-[44px]">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>Pulihkan Cadangan (.JSON)</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>

            <PopoverConfirm
              isOpen={restoreConfirmOpen}
              title="Pulihkan Data Cadangan?"
              description={`File: "${pendingFileName}". Seluruh data lokal saat ini akan ditimpa oleh data cadangan ini.`}
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
            description="Perhatian: Seluruh barang, hutang piutang, dan riwayat transaksi akan dihapus bersih."
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
    </div>
  );
};
