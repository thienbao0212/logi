export interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch?: string;
  currency: 'VND' | 'USD';
  initialBalance: number;
  currentBalance: number;
  isCashFund: boolean;
  isActive: boolean;
}

const DEFAULT_ACCOUNTS: BankAccount[] = [
  {
    id: 'acc-vcb-usd',
    accountName: 'VCB - USD',
    accountNumber: '0071001234567',
    bankName: 'Vietcombank (Ngoại Thương)',
    branch: 'Chi nhánh TP.HCM',
    currency: 'USD',
    initialBalance: 30000,
    currentBalance: 45200,
    isCashFund: false,
    isActive: true,
  },
  {
    id: 'acc-acb-vnd',
    accountName: 'ACB - VND',
    accountNumber: '188899999',
    bankName: 'Ngân hàng TMCP Á Châu (ACB)',
    branch: 'Chi nhánh Sài Gòn',
    currency: 'VND',
    initialBalance: 800000000,
    currentBalance: 1250000000,
    isCashFund: false,
    isActive: true,
  },
  {
    id: 'acc-tcb-vnd',
    accountName: 'TCB - VND',
    accountNumber: '19033445566',
    bankName: 'Techcombank',
    branch: 'Chi nhánh Tân Bình',
    currency: 'VND',
    initialBalance: 300000000,
    currentBalance: 480000000,
    isCashFund: false,
    isActive: true,
  },
  {
    id: 'acc-cash-vnd',
    accountName: 'Quỹ tiền mặt VND',
    accountNumber: 'CASH-01',
    bankName: 'Két tiền mặt Trụ sở',
    branch: 'Văn phòng chính',
    currency: 'VND',
    initialBalance: 50000000,
    currentBalance: 35000000,
    isCashFund: true,
    isActive: true,
  },
];

const STORAGE_KEY = 'logiflow_bank_accounts';

export function getBankAccounts(): BankAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ACCOUNTS;
  }
}

export function saveBankAccount(account: Partial<BankAccount> & { accountName: string; bankName: string }): BankAccount {
  const list = getBankAccounts();
  if (account.id) {
    const idx = list.findIndex((a) => a.id === account.id);
    if (idx >= 0) {
      const updated = { ...list[idx], ...account };
      list[idx] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return updated;
    }
  }

  const newAcc: BankAccount = {
    id: `acc-${Date.now()}`,
    accountName: account.accountName.trim(),
    accountNumber: account.accountNumber?.trim() || 'N/A',
    bankName: account.bankName.trim(),
    branch: account.branch?.trim() || '',
    currency: account.currency || 'VND',
    initialBalance: Number(account.initialBalance || 0),
    currentBalance: Number(account.initialBalance || 0),
    isCashFund: !!account.isCashFund,
    isActive: account.isActive ?? true,
  };

  list.push(newAcc);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return newAcc;
}

export function deleteBankAccount(id: string): void {
  const list = getBankAccounts().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function resetBankAccounts(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
}
