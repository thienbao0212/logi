// Operating Expense mock service — quản lý chi phí hoạt động doanh nghiệp (overhead)

export type ExpenseCategory =
  | 'SALARY'
  | 'OFFICE'
  | 'UTILITIES'
  | 'MARKETING'
  | 'TRANSPORT'
  | 'OTHER';

export type ExpenseStatus = 'PENDING' | 'PAID';

export interface OperatingExpense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description: string;
  amount: number;
  paidBy?: string;
  status: ExpenseStatus;
  notes?: string;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  SALARY: 'Lương & Phúc lợi',
  OFFICE: 'Văn phòng phẩm',
  UTILITIES: 'Điện, nước, internet',
  MARKETING: 'Marketing',
  TRANSPORT: 'Đi lại nội bộ',
  OTHER: 'Chi phí khác',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  SALARY: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
  OFFICE: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
  UTILITIES: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
  MARKETING: 'bg-pink-100 dark:bg-pink-950/60 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800/60',
  TRANSPORT: 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/60',
  OTHER: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
};

const EXPENSE_KEY = 'logiflow_operating_expenses';

export const ExpenseService = {
  getAll(): OperatingExpense[] {
    try {
      return JSON.parse(localStorage.getItem(EXPENSE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  save(expense: OperatingExpense): void {
    const all = this.getAll();
    const idx = all.findIndex(e => e.id === expense.id);
    if (idx >= 0) all[idx] = expense;
    else all.unshift(expense);
    localStorage.setItem(EXPENSE_KEY, JSON.stringify(all));
  },

  delete(id: string): void {
    localStorage.setItem(EXPENSE_KEY, JSON.stringify(this.getAll().filter(e => e.id !== id)));
  },

  getMonthlySummary(month: string): { total: number; paid: number; pending: number; byCategory: Record<string, number> } {
    const all = this.getAll().filter(e => e.date.startsWith(month));
    const total = all.reduce((s, e) => s + e.amount, 0);
    const paid = all.filter(e => e.status === 'PAID').reduce((s, e) => s + e.amount, 0);
    const pending = all.filter(e => e.status === 'PENDING').reduce((s, e) => s + e.amount, 0);
    const byCategory: Record<string, number> = {};
    all.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
    return { total, paid, pending, byCategory };
  },
};
 
