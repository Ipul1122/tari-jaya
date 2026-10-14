import React, { useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface PopoverConfirmProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

export const PopoverConfirm: React.FC<PopoverConfirmProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  position = 'top-right',
  onConfirm,
  onCancel,
  className = '',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Positioning classes
  const positionClasses = {
    'top-right': 'bottom-full right-0 mb-2 origin-bottom-right',
    'top-left': 'bottom-full left-0 mb-2 origin-bottom-left',
    'top-center': 'bottom-full left-1/2 -translate-x-1/2 mb-2 origin-bottom',
    'bottom-right': 'top-full right-0 mt-2 origin-top-right',
    'bottom-left': 'top-full left-0 mt-2 origin-top-left',
    'bottom-center': 'top-full left-1/2 -translate-x-1/2 mt-2 origin-top',
  }[position];

  // Arrow caret classes
  const arrowClasses = {
    'top-right': 'bottom-[-6px] right-3 border-r border-b',
    'top-left': 'bottom-[-6px] left-3 border-r border-b',
    'top-center': 'bottom-[-6px] left-1/2 -translate-x-1/2 border-r border-b',
    'bottom-right': 'top-[-6px] right-3 border-l border-t',
    'bottom-left': 'top-[-6px] left-3 border-l border-t',
    'bottom-center': 'top-[-6px] left-1/2 -translate-x-1/2 border-l border-t',
  }[position];

  const variantStyles = {
    danger: {
      confirmBtn: 'bg-red-600 hover:bg-red-700 text-white font-bold',
      icon: <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />,
      border: 'border-red-200',
    },
    warning: {
      confirmBtn: 'bg-orange-500 hover:bg-orange-600 text-white font-bold',
      icon: <AlertCircle className="w-4 h-4 text-orange-600 shrink-0" />,
      border: 'border-orange-200',
    },
    primary: {
      confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white font-bold',
      icon: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
      border: 'border-blue-200',
    },
  }[variant];

  return (
    <div
      ref={popoverRef}
      className={`absolute z-50 w-64 sm:w-72 bg-white border border-stone-200 rounded-2xl p-3.5 shadow-2xl animate-fade-in ${positionClasses} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Small Arrow indicator */}
      <div
        className={`absolute w-3 h-3 bg-white border-stone-200 transform rotate-45 ${arrowClasses}`}
      />

      {/* Popover Header */}
      <div className="flex items-start space-x-2">
        <div className="mt-0.5">{variantStyles.icon}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-900 leading-snug">{title}</h4>
          {description && (
            <p className="text-[11px] text-stone-600 leading-relaxed mt-1">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2 mt-3 pt-2.5 border-t border-stone-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-slate-900 hover:bg-stone-100 transition active:scale-95"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-3 py-1.5 rounded-lg text-xs shadow-xs active:scale-95 transition ${variantStyles.confirmBtn}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  );
};
