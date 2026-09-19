/**
 * LogiFlow Design Tokens & Semantic Utilities
 * Unified tokens for dark/light theme consistency across the application.
 * Generated & calibrated according to ui-ux-pro-max design system.
 */

export const themeTokens = {
  // Surface tokens
  surface: {
    // Ambient canvas - transparent so the AppShell gradient shows through
    canvas: 'bg-transparent',
    // Glassmorphic floating card with crisp borders
    card: 'bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs rounded-2xl',
    // Solid surface card
    cardSolid: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl',
    // Inner panel / nested section
    panel: 'bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-xl',
    // Modal dialog box
    modal: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl',
    // Dropdown / Popover menu
    popover: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl',
  },

  // Text color hierarchy - ensuring minimum 4.5:1 contrast
  text: {
    primary: 'text-slate-900 dark:text-slate-100',
    secondary: 'text-slate-700 dark:text-slate-300',
    muted: 'text-slate-600 dark:text-slate-400',
    hint: 'text-slate-500 dark:text-slate-400',
    inverse: 'text-white dark:text-slate-900',
    brand: 'text-blue-600 dark:text-blue-400',
    accent: 'text-orange-600 dark:text-orange-400',
  },

  // Borders & Dividers
  border: {
    default: 'border-slate-200 dark:border-slate-800',
    subtle: 'border-slate-200/70 dark:border-slate-800/70',
    divider: 'divide-slate-100 dark:divide-slate-800/60',
  },

  // Interactive Elements
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer',
    success: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 cursor-pointer',
    accent: 'bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 cursor-pointer',
    secondary: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer',
    ghost: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer',
    danger: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer',
  },

  // CRUD Semantic Action Tokens (Strictly synchronized across all pages)
  crud: {
    // THÊM / TẠO (Add / Create / New / Lập mới) -> Emerald Green
    add: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer',
    // SỬA / CẬP NHẬT / LƯU (Edit / Update / Save) -> Tracking Blue
    edit: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer',
    // XÓA / HỦY BỎ (Delete / Remove / Clear) -> Rose Red
    delete: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer',
    // HỦY BỎ THAO TÁC (Dismiss / Cancel Modal) -> Secondary Outline
    cancel: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors cursor-pointer',
    // Table Row Action Icons
    iconEdit: 'p-1.5 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition-colors cursor-pointer',
    iconDelete: 'p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition-colors cursor-pointer',
  },

  // Form Controls
  input: {
    base: 'bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500',
  },

  // Status Badges & Chips (Non-wrapping, High Contrast)
  badge: {
    success: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    warning: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    danger: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    info: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    neutral: 'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  },

  // Table design
  table: {
    container: 'overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/95 dark:bg-slate-900/90 shadow-xs backdrop-blur-xl',
    header: 'bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider',
    row: 'hover:bg-slate-50/90 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/70 transition-colors',
  },
} as const;

export default themeTokens;
