import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, { container: string; dot: string }> = {
  success: {
    container: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
  },
  warning: {
    container: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
    dot: 'bg-amber-500 dark:bg-amber-400',
  },
  danger: {
    container: 'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800/60',
    dot: 'bg-red-500 dark:bg-red-400',
  },
  info: {
    container: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  neutral: {
    container: 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800/70 dark:text-slate-300 dark:border-slate-700/80',
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
  purple: {
    container: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60',
    dot: 'bg-purple-500 dark:bg-purple-400',
  },
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-bold rounded-full border shadow-2xs select-none whitespace-nowrap shrink-0
        ${styles.container}
        ${SIZE_STYLES[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
 
