import React from 'react';
import type { KnownCustomer } from '../../db/debtOperations';
import { formatCurrency } from '../../utils/formatters';
import { User, UserPlus, Search, Phone, ShieldAlert } from 'lucide-react';

interface PaymentCustomerSelectorProps {
  knownCustomers: KnownCustomer[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCustomer: KnownCustomer | null;
  onSelectCustomer: (c: KnownCustomer) => void;
  isCreatingNew: boolean;
  onStartNewCustomer: () => void;
  onResetCustomer: () => void;
  newCustomerName: string;
  onNewCustomerNameChange: (val: string) => void;
  newCustomerPhone: string;
  onNewCustomerPhoneChange: (val: string) => void;
}

export const PaymentCustomerSelector: React.FC<PaymentCustomerSelectorProps> = ({
  knownCustomers,
  searchQuery,
  onSearchChange,
  selectedCustomer,
  onSelectCustomer,
  isCreatingNew,
  onStartNewCustomer,
  onResetCustomer,
  newCustomerName,
  onNewCustomerNameChange,
  newCustomerPhone,
  onNewCustomerPhoneChange,
}) => {
  const filteredCustomers = searchQuery.trim()
    ? knownCustomers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          (c.phone && c.phone.includes(searchQuery.trim()))
      )
    : knownCustomers;

  return (
    <div className="bg-white p-3.5 rounded-2xl border border-stone-200 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
          <User className="w-3.5 h-3.5 text-orange-600" />
          <span>Nama Pembeli / Tukang / Mandor <b className="text-red-500">*</b></span>
        </label>
        <button
          type="button"
          onClick={onStartNewCustomer}
          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1"
        >
          <UserPlus className="w-3 h-3" />
          <span>Tukang / Mandor Baru</span>
        </button>
      </div>

      {!isCreatingNew && (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari nama pelanggan, tukang, mandor..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-stone-50 border border-stone-200 text-slate-900 focus:outline-none focus:border-orange-500 min-h-[38px]"
            />
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-1">
            {filteredCustomers.map((c) => {
              const isSelected = selectedCustomer?.name === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => onSelectCustomer(c)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl border flex items-center space-x-1.5 transition active:scale-95 text-left ${
                    isSelected
                      ? 'bg-orange-50 border-orange-500 text-orange-900 font-bold shadow-xs'
                      : 'bg-stone-50 border-stone-200 text-slate-800 hover:bg-stone-100'
                  }`}
                >
                  <span>{c.name}</span>
                  {c.hasActiveDebt && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1 py-0.2 rounded font-mono font-bold">
                      Kasbon {formatCurrency(c.activeDebt)}
                    </span>
                  )}
                </button>
              );
            })}
            {filteredCustomers.length === 0 && (
              <div className="w-full text-center py-2 text-[11px] text-stone-500">
                Nama "{searchQuery}" belum ada.{' '}
                <button
                  type="button"
                  onClick={onStartNewCustomer}
                  className="text-orange-600 font-bold underline"
                >
                  Buat baru sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {(selectedCustomer || isCreatingNew) && (
        <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-800">
              {selectedCustomer ? 'Tukang / Pelanggan Terpilih:' : 'Data Tukang / Pembeli Baru:'}
            </span>
            <button
              type="button"
              onClick={onResetCustomer}
              className="text-[10px] text-stone-500 hover:text-stone-700 font-medium underline"
            >
              Ganti
            </button>
          </div>

          {isCreatingNew ? (
            <div className="space-y-2">
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => onNewCustomerNameChange(e.target.value)}
                placeholder="Ketik nama pembeli, tukang, atau mandor..."
                className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-stone-300 font-bold text-slate-900 focus:outline-none focus:border-orange-500 min-h-[38px]"
                autoFocus
              />
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => onNewCustomerPhoneChange(e.target.value)}
                  placeholder="No. WhatsApp / HP (opsional)..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-white border border-stone-300 text-slate-900 focus:outline-none focus:border-orange-500 min-h-[38px]"
                />
              </div>
            </div>
          ) : (
            <div>
              <h4 className="text-xs font-bold text-slate-900">{selectedCustomer?.name}</h4>
              {selectedCustomer?.phone && (
                <span className="text-[11px] text-stone-500 block font-mono">
                  WA: {selectedCustomer.phone}
                </span>
              )}
              {selectedCustomer?.hasActiveDebt && (
                <div className="mt-1.5 p-2 rounded-lg bg-amber-100/90 border border-amber-300 text-[11px] text-amber-900 flex items-start space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    Pelanggan ini memiliki sisa kasbon sebesar{' '}
                    <b>{formatCurrency(selectedCustomer.activeDebt)}</b>.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
