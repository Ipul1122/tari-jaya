import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: string;
  colorScheme?: 'orange' | 'red' | 'blue' | 'emerald' | 'slate';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  colorScheme = 'slate',
}) => {
  const schemeClasses = {
    orange: {
      bg: 'bg-white border-orange-200/90 hover:border-orange-300',
      iconBg: 'bg-orange-100 text-orange-600 border-orange-200',
      valueColor: 'text-orange-600',
    },
    red: {
      bg: 'bg-white border-red-200/90 hover:border-red-300',
      iconBg: 'bg-red-100 text-red-600 border-red-200',
      valueColor: 'text-red-600',
    },
    blue: {
      bg: 'bg-white border-blue-200/90 hover:border-blue-300',
      iconBg: 'bg-blue-100 text-blue-600 border-blue-200',
      valueColor: 'text-blue-600',
    },
    emerald: {
      bg: 'bg-white border-emerald-200/90 hover:border-emerald-300',
      iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      valueColor: 'text-emerald-700',
    },
    slate: {
      bg: 'bg-white border-stone-200/90 hover:border-stone-300',
      iconBg: 'bg-stone-100 text-slate-700 border-stone-200',
      valueColor: 'text-slate-900',
    },
  }[colorScheme];

  return (
    <div className={`p-3.5 rounded-2xl border shadow-sm ${schemeClasses.bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-stone-600 tracking-tight">{label}</span>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border text-xs ${schemeClasses.iconBg}`}>
          {icon}
        </div>
      </div>

      <div className="mt-2">
        <h3 className={`text-base font-mono font-bold tracking-tight ${schemeClasses.valueColor}`}>
          {value}
        </h3>
        {subValue && (
          <p className="text-[10px] text-stone-500 font-medium mt-0.5">{subValue}</p>
        )}
      </div>

      {trend && (
        <span className="inline-block mt-1.5 text-[10px] text-emerald-700 font-bold">
          {trend}
        </span>
      )}
    </div>
  );
};
