import React, { useId } from 'react';
import { ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';

export interface InputNumberProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  helperText?: string;
  value?: number;
  onChange?: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

export function InputNumber({
  label,
  error,
  helperText,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  id,
  required,
  disabled,
  className = '',
  ...props
}: InputNumberProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const handleStep = (direction: 'up' | 'down') => {
    if (disabled) return;
    const current = typeof value === 'number' ? value : 0;
    const delta = direction === 'up' ? step : -step;
    let next = current + delta;
    if (typeof min === 'number' && next < min) next = min;
    if (typeof max === 'number' && next > max) next = max;
    onChange?.(next);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.trim();
    if (raw === '') {
      onChange?.(0);
      return;
    }
    const parsed = Number(raw);
    if (!isNaN(parsed)) {
      let finalVal = parsed;
      if (typeof min === 'number' && finalVal < min) finalVal = min;
      if (typeof max === 'number' && finalVal > max) finalVal = max;
      onChange?.(finalVal);
    }
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 select-none"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={inputId}
          type="number"
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          value={typeof value === 'number' ? value : ''}
          onChange={handleInputChange}
          className={`
            w-full py-2 pl-3.5 pr-14 text-xs rounded-xl font-mono font-medium transition-all duration-150
            bg-slate-50/60 hover:bg-white focus:bg-white outline-none
            border
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900'
              : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900'
            }
            disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />

        {suffix && (
          <span className="absolute right-9 text-xs font-semibold text-slate-400 select-none pointer-events-none">
            {suffix}
          </span>
        )}

        {/* Stepper Buttons */}
        <div className="absolute right-1 top-1 bottom-1 flex flex-col justify-center border-l border-slate-200/80 pl-1 pr-0.5">
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || (typeof max === 'number' && typeof value === 'number' && value >= max)}
            onClick={() => handleStep('up')}
            className="flex-1 px-1 flex items-center justify-center hover:bg-slate-200 text-slate-500 rounded disabled:opacity-30"
          >
            <ChevronUp size={12} />
          </button>
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled || (typeof min === 'number' && typeof value === 'number' && value <= min)}
            onClick={() => handleStep('down')}
            className="flex-1 px-1 flex items-center justify-center hover:bg-slate-200 text-slate-500 rounded disabled:opacity-30"
          >
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-red-600 flex items-center gap-1 mt-1">
          <AlertCircle size={12} className="shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
 
