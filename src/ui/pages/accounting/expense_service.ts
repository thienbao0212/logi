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
  SALARY: 'bg-blue-100 text-blue-800 border-blue-200',
  OFFICE: 'bg-purple-100 text-purple-800 border-purple-200',
  UTILITIES: 'bg-amber-100 text-amber-800 border-amber-200',
  MARKETING: 'bg-pink-100 text-pink-800 border-pink-200',
  TRANSPORT: 'bg-orange-100 text-orange-800 border-orange-200',
  OTHER: 'bg-slate-100 text-slate-700 border-slate-200',
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
 
