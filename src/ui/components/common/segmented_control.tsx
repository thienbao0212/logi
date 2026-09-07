import React from 'react';

export interface SegmentedOption {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  activeClass?: string;
  activeBadge?: string;
}

export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps) {
  return (
    <div
      className={`
        flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800/80 p-1 rounded-xl shrink-0 overflow-x-auto hide-scrollbar select-none
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {options.map((opt) => {
        const isActive = value === opt.id;
        const defaultActiveClass = 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-bold';
        const activeClass = opt.activeClass || defaultActiveClass;
        const activeBadge = opt.activeBadge || 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200';

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap
              ${isActive ? activeClass : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-medium'}
            `.trim().replace(/\s+/g, ' ')}
          >
            {opt.icon && <span className="shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>

            {typeof opt.count === 'number' && (
              <span
                className={`
                  px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold transition-colors
                  ${isActive ? activeBadge : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
                `.trim().replace(/\s+/g, ' ')}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
 
