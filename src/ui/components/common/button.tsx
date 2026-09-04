import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-sm border border-transparent',
  secondary: 'bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 border border-slate-200 shadow-2xs',
  success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-sm border border-transparent',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs hover:shadow-sm border border-transparent',
  outline: 'bg-transparent hover:bg-slate-50 text-slate-700 border border-slate-300',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-transparent',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-3.5 py-2 text-xs font-semibold rounded-xl gap-1.5',
  lg: 'px-4 py-2.5 text-sm font-semibold rounded-xl gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium transition-all duration-150 select-none shrink-0
        focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
        ${VARIANT_CLASSES[variant]}
        ${SIZE_CLASSES[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'lg' ? 16 : 14} className="animate-spin text-current shrink-0" />
      ) : icon && iconPosition === 'left' ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}

      {children && <span>{children}</span>}

      {!loading && icon && iconPosition === 'right' ? (
        <span className="shrink-0 flex items-center">{icon}</span>
      ) : null}
    </button>
  );
});

Button.displayName = 'Button';
 
