import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  itemName?: string;
  itemsPerPageOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemName = 'data',
  itemsPerPageOptions = [10, 20, 50],
}) => {
  if (totalItems <= 0) return null;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | string)[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div className="p-3 bg-white border border-stone-200/90 rounded-2xl shadow-xs space-y-3 mt-4 text-slate-900">
      {/* Top row: Showing range & per-page selector */}
      <div className="flex items-center justify-between text-xs text-stone-600 gap-2">
        <span className="text-[11px] font-medium text-stone-500">
          Menampilkan <b className="font-mono text-slate-900 font-bold">{formatNumber(startIndex + 1)}</b>-
          <b className="font-mono text-slate-900 font-bold">{formatNumber(endIndex)}</b> dari{' '}
          <b className="font-mono text-slate-900 font-bold">{formatNumber(totalItems)}</b> {itemName}
        </span>

        {onItemsPerPageChange && (
          <div className="flex items-center space-x-1 shrink-0">
            <span className="text-[10px] text-stone-400 font-medium">Per hal:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="py-1 px-1.5 rounded-lg bg-stone-50 border border-stone-200 text-slate-800 text-[11px] font-bold focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bottom row: Page navigation buttons */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 gap-1">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="flex items-center space-x-1 py-1.5 px-2.5 rounded-xl border border-stone-200 bg-stone-50 text-slate-700 text-xs font-semibold hover:bg-stone-100 disabled:opacity-35 disabled:hover:bg-stone-50 active:scale-95 transition min-h-[34px]"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sebelumnya</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`dots-${idx}`} className="px-1 text-xs text-stone-400 font-bold select-none">
                    ...
                  </span>
                );
              }

              const pageNum = p as number;
              const isCurrent = pageNum === currentPage;

              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-mono font-bold flex items-center justify-center transition active:scale-95 ${
                    isCurrent
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-700'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="flex items-center space-x-1 py-1.5 px-2.5 rounded-xl border border-stone-200 bg-stone-50 text-slate-700 text-xs font-semibold hover:bg-stone-100 disabled:opacity-35 disabled:hover:bg-stone-50 active:scale-95 transition min-h-[34px]"
            title="Halaman Selanjutnya"
          >
            <span className="hidden xs:inline">Selanjutnya</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
