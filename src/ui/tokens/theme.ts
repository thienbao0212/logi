/**
 * LogiFlow Design Tokens & Semantic Utilities
 * Unified tokens for dark/light theme consistency across the application.
 */

export const themeTokens = {
  // Surface tokens
  surface: {
    // Ambient canvas - transparent so the AppShell gradient shows through
    canvas: 'bg-transparent',
    // Glassmorphic floating card
    card: 'bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs rounded-2xl',
    // Solid surface card
    cardSolid: 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs rounded-2xl',
    // Inner panel / nested section
    panel: 'bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 rounded-xl',
    // Modal dialog box
    modal: 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl',
    // Dropdown / Popover menu
    popover: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl',
  },

  // Text color hierarchy
  text: {
    primary: 'text-slate-900 dark:text-white',
    secondary: 'text-slate-700 dark:text-slate-300',
    muted: 'text-slate-500 dark:text-slate-400',
    hint: 'text-slate-400 dark:text-slate-500',
    inverse: 'text-white dark:text-slate-900',
    brand: 'text-blue-600 dark:text-blue-400',
  },

  // Borders & Dividers
  border: {
    default: 'border-slate-200 dark:border-slate-800',
    subtle: 'border-slate-200/60 dark:border-slate-800/60',
    divider: 'divide-slate-100 dark:divide-slate-800/60',
  },

  // Interactive Elements
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs transition-colors',
    secondary: 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-colors',
    ghost: 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
    danger: 'bg-red-600 hover:bg-red-700 text-white font-medium shadow-xs transition-colors',
  },

  // Form Controls
  input: {
    base: 'bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl transition-colors focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
  },

  // Table design
  table: {
    container: 'overflow-hidden border border-slate-200/80 dark:border-slate-800/80 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl',
    header: 'bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider',
    row: 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 transition-colors',
  },
} as const;

export default themeTokens;
