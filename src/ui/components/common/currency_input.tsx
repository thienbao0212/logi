import React, { useState, useEffect } from 'react';

export interface CurrencyInputProps {
  value: number | undefined | null;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  currencySymbol?: string;
  disabled?: boolean;
  required?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  error?: string;
  helperText?: string;
}

export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
  currencySymbol = '₫',
  disabled = false,
  required = false,
  size = 'md',
  label,
  error,
  helperText,
}: CurrencyInputProps) {
  const [displayStr, setDisplayStr] = useState(() => (value ? value.toLocaleString('vi-VN') : ''));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDisplayStr(value ? value.toLocaleString('vi-VN') : '');
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = raw ? parseInt(raw, 10) : 0;
    setDisplayStr(raw ? Number(raw).toLocaleString('vi-VN') : '');
    onChange(num);
  };

  const sizeClasses = {
    sm: 'py-1 pl-2.5 pr-6 text-xs',
    md: 'py-2 pl-3.5 pr-8 text-xs',
    lg: 'py-2.5 pl-4 pr-9 text-sm',
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 select-none">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className={`relative inline-flex items-center w-full ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        <input
          type="text"
          disabled={disabled}
          required={required}
          value={displayStr}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full border rounded-xl font-mono font-bold text-slate-900 bg-slate-50/70 hover:bg-white focus:bg-white transition-all outline-none text-right shadow-2xs ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
          } ${sizeClasses[size]} ${className}`}
        />
        <span className="absolute right-3 text-xs text-slate-400 font-mono font-semibold pointer-events-none select-none">
          {currencySymbol}
        </span>
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-red-600 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}

export default CurrencyInput;
