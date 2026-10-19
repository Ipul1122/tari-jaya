import React, { useState, useEffect } from 'react';
import { db } from '../../db/schema';
import { formatDate } from '../../utils/formatters';
import { FileSpreadsheet, Calendar, CheckCircle2, X, Download } from 'lucide-react';

export type ExportPeriodKey = 'ALL' | 'LAST_1_3_MONTHS' | 'LAST_4_6_MONTHS' | 'LAST_1_YEAR' | 'LAST_2_YEARS';

export interface ExportPeriodConfig {
  key: ExportPeriodKey;
  label: string;
  sublabel: string;
  startDate?: string;
  endDate?: string;
}

interface ExcelExportPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (config: ExportPeriodConfig) => Promise<void>;
  isExporting: boolean;
}

export const ExcelExportPeriodModal: React.FC<ExcelExportPeriodModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  isExporting,
}) => {
  const [selectedKey, setSelectedKey] = useState<ExportPeriodKey>('ALL');
  const [counts, setCounts] = useState<Record<ExportPeriodKey, number>>({
    ALL: 0,
    LAST_1_3_MONTHS: 0,
    LAST_4_6_MONTHS: 0,
    LAST_1_YEAR: 0,
    LAST_2_YEARS: 0,
  });

  // Calculate dynamic date ranges
  const options = React.useMemo<ExportPeriodConfig[]>(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // 3 months ago
    const d3 = new Date(now);
    d3.setMonth(d3.getMonth() - 3);
    const d3Str = d3.toISOString().slice(0, 10);

    // 6 months ago
    const d6 = new Date(now);
    d6.setMonth(d6.getMonth() - 6);
    const d6Str = d6.toISOString().slice(0, 10);

    // 1 year ago
    const d1y = new Date(now);
    d1y.setFullYear(d1y.getFullYear() - 1);
    const d1yStr = d1y.toISOString().slice(0, 10);

    // 2 years ago
    const d2y = new Date(now);
    d2y.setFullYear(d2y.getFullYear() - 2);
    const d2yStr = d2y.toISOString().slice(0, 10);

    return [
      {
        key: 'ALL',
        label: 'Semua Data Transaksi',
        sublabel: 'Seluruh riwayat mutasi barang sejak awal toko berdiri',
      },
      {
        key: 'LAST_1_3_MONTHS',
        label: '1 - 3 Bulan Terakhir',
        sublabel: `Transaksi 3 bulan ke belakang (${formatDate(d3Str)} s/d ${formatDate(todayStr)})`,
        startDate: d3Str,
        endDate: todayStr,
      },
      {
        key: 'LAST_4_6_MONTHS',
        label: '4 - 6 Bulan yang Lalu',
        sublabel: `Transaksi periode lalu (${formatDate(d6Str)} s/d ${formatDate(d3Str)})`,
        startDate: d6Str,
        endDate: d3Str,
      },
      {
        key: 'LAST_1_YEAR',
        label: '1 Tahun Terakhir (12 Bulan)',
        sublabel: `Transaksi 1 tahun ke belakang (${formatDate(d1yStr)} s/d ${formatDate(todayStr)})`,
        startDate: d1yStr,
        endDate: todayStr,
      },
      {
        key: 'LAST_2_YEARS',
        label: '2 Tahun Terakhir (24 Bulan)',
        sublabel: `Transaksi 2 tahun ke belakang (${formatDate(d2yStr)} s/d ${formatDate(todayStr)})`,
        startDate: d2yStr,
        endDate: todayStr,
      },
    ];
  }, []);

  // Fetch count preview for each period
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    (async () => {
      const allMutations = await db.stock_mutations.toArray();
      if (!isMounted) return;

      const newCounts: Record<ExportPeriodKey, number> = {
        ALL: allMutations.length,
        LAST_1_3_MONTHS: 0,
        LAST_4_6_MONTHS: 0,
        LAST_1_YEAR: 0,
        LAST_2_YEARS: 0,
      };

      for (const opt of options) {
        if (opt.key === 'ALL') continue;
        const start = opt.startDate ? `${opt.startDate}T00:00:00.000Z` : '';
        const end = opt.endDate ? `${opt.endDate}T23:59:59.999Z` : '';

        const matched = allMutations.filter((m) => {
          if (opt.key === 'LAST_4_6_MONTHS') {
            return m.timestamp >= start && m.timestamp < end;
          }
          return m.timestamp >= start;
        });

        newCounts[opt.key] = matched.length;
      }

      setCounts(newCounts);
    })();

    return () => {
      isMounted = false;
    };
  }, [isOpen, options]);

  if (!isOpen) return null;

  const activeOption = options.find((o) => o.key === selectedKey) || options[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirmExport(activeOption);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pilih Periode Unduh Excel</h3>
              <p className="text-[11px] text-stone-500">Konfirmasi rentang waktu data yang ingin diunduh</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options List */}
        <form onSubmit={handleSubmit} className="p-4 space-y-2.5 overflow-y-auto flex-1">
          <p className="text-xs font-semibold text-stone-700 mb-1 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <span>Pilihan Rentang Waktu:</span>
          </p>

          <div className="space-y-2">
            {options.map((opt) => {
              const isSelected = opt.key === selectedKey;
              const count = counts[opt.key];

              return (
                <div
                  key={opt.key}
                  onClick={() => setSelectedKey(opt.key)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition active:scale-[0.99] flex items-start justify-between space-x-3 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'bg-white border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-900'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-600">
                        {count} transaksi
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{opt.sublabel}</p>
                  </div>

                  <div className="shrink-0 mt-0.5">
                    {isSelected ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-stone-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed">
            <b>Catatan:</b> File Excel (.xlsx) akan berisi 4 lembar kerja (Ringkasan Finansial, Riwayat Transaksi sesuai periode, Katalog Stok Saat Ini, dan Buku Piutang).
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="w-1/3 py-2.5 px-3 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-50 active:scale-95 transition min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isExporting}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition flex items-center justify-center space-x-1.5 min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Memproses Ekspor...' : 'Unduh Sekarang (.xlsx)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
