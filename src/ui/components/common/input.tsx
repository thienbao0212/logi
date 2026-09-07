import React, { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  id,
  required,
  disabled,
  className = '',
  ...props
}, ref) => {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          required={required}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={`
            w-full py-2 text-xs rounded-xl font-medium transition-all duration-150
            bg-slate-50/60 hover:bg-white focus:bg-white dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:focus:bg-slate-800 outline-none
            border
            ${error
              ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-red-900 dark:text-red-200 placeholder:text-red-300'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500'
            }
            ${leftIcon ? 'pl-9' : 'pl-3.5'}
            ${rightIcon || error ? 'pr-9' : 'pr-3.5'}
            disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed
            ${className}
          `.trim().replace(/\s+/g, ' ')}
          {...props}
        />

        {error ? (
          <div className="absolute right-3 flex items-center pointer-events-none text-red-500">
            <AlertCircle size={15} />
          </div>
        ) : rightIcon ? (
          <div className="absolute right-3 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </div>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="text-[11px] font-medium text-red-600 flex items-center gap-1 mt-1">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-[11px] text-slate-500 mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
 
