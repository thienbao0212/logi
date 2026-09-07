import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  Building,
  Calendar,
  Plus,
  Trash2,
  Landmark,
  Coins
} from 'lucide-react';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';
import {
  ExportButton,
  SearchInput,
  SegmentedControl,
  Button,
  Modal,
  Input,
  Dropdown,
} from '../../components/common/index.js';
import {
  BankAccount,
  getBankAccounts,
  saveBankAccount,
  deleteBankAccount,
} from './bank_account_service.js';

interface CashbookRow {
  id: string;
  date: string;
  ref: string;
  type: 'IN' | 'OUT';
  account: string;
  category: string;
  party: string;
  amount: number;
  balance: number;
}

export default function CashbookTab() {
  const [data, setData] = useState<CashbookRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');
  const [accounts, setAccounts] = useState<BankAccount[]>(() => getBankAccounts());
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [newAccForm, setNewAccForm] = useState<Partial<BankAccount>>({
    accountName: '',
    accountNumber: '',
    bankName: '',
    branch: '',
    currency: 'VND',
    initialBalance: 0,
    isCashFund: false,
  });

  const refreshAccounts = () => {
    setAccounts(getBankAccounts());
  };

  useEffect(() => {
    const loadData = async () => {
      const requests = await FinancialService.getRequests('');
      
      const ledger: CashbookRow[] = [];
      let balance = 0;
      
      // We only care about transactions where money has actually moved (paidAmount > 0)
      const paidReqs = requests.filter(r => (r.paidAmount || 0) > 0);
      
      // Sort ascending to calculate running balance correctly
      paidReqs.sort((a, b) => (a.requestDate || '').localeCompare(b.requestDate || ''));

      paidReqs.forEach(req => {
        const paid = req.paidAmount || 0;
        if (req.type === 'THU') {
          balance += paid;
        } else {
          balance -= paid;
        }
        
        ledger.push({
          id: req.id,
          date: req.requestDate || new Date().toISOString().slice(0, 10),
          ref: req.id,
          type: req.type === 'THU' ? 'IN' : 'OUT',
          account: req.currency === 'VND' ? 'ACB - VND' : 'VCB - USD',
          category: req.category || 'Vận chuyển',
          party: req.partyName || 'Đối tác',
          amount: paid,
          balance: balance
        });
      });
      
      // Display newest first
      setData(ledger.reverse());
    };

    loadData();
  }, []);

  // Filtered rows
  const filteredData = useMemo(() => {
    return data.filter(r => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = 
        !q ||
        r.ref.toLowerCase().includes(q) ||
        r.party.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.account.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (selectedAccount !== 'ALL' && r.account !== selectedAccount) {
        return false;
      }

      return true;
    });
  }, [data, searchQuery, selectedAccount]);

  // KPIs calculation
  const metrics = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    
    data.forEach(r => {
      if (r.type === 'IN') {
        totalIn += r.amount;
      } else {
        totalOut += r.amount;
      }
    });

    const currentBalance = totalIn - totalOut;

    return {
      currentBalance,
      totalIn,
      totalOut,
      count: data.length
    };
  }, [data]);

  const handleExportCsv = () => {
    const headers = ['Ngày ghi sổ', 'Mã chứng từ (Ref)', 'Tài khoản quỹ', 'Đối tượng nộp / nhận', 'Hạng mục', 'Tiền vào (+)', 'Tiền ra (-)', 'Số dư lũy kế'];
    const rows = filteredData.map(r => [
      r.date,
      r.ref,
      `"${r.account}"`,
      `"${r.party}"`,
      `"${r.category}"`,
      r.type === 'IN' ? r.amount : 0,
      r.type === 'OUT' ? r.amount : 0,
      r.balance
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `So_quy_tien_mat_ngan_hang_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Số dư quỹ hiện tại */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Số dư quỹ hiện tại</span>
            <div className={`text-xl font-bold font-mono mt-1 ${metrics.currentBalance >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              ${metrics.currentBalance.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">Tổng tiền mặt & tài khoản ngân hàng</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/60">
            <Wallet size={20} />
          </div>
        </div>

        {/* Card 2: Tổng thu vào */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tổng tiền vào (Inflow)</span>
            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-1">
              +${metrics.totalIn.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 block">Tiền thực thu từ khách hàng</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/60">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Card 3: Tổng chi ra */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Tổng tiền ra (Outflow)</span>
            <div className="text-xl font-bold text-rose-700 dark:text-rose-400 font-mono mt-1">
              -${metrics.totalOut.toLocaleString()}
            </div>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5 block">Tiền thực chi trả đối tác & dịch vụ</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-800/60">
            <TrendingDown size={20} />
          </div>
        </div>

        {/* Card 4: Số lượng giao dịch */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Số giao dịch thực tế</span>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">
              {metrics.count} bút toán
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">Đã giải ngân & đối chiếu</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800/60">
            <Receipt size={20} />
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Account filter + Export button */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search Box */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo mã phiếu, đối tượng nộp/nhận, hạng mục..."
          maxWidth="max-w-md"
        />

        {/* Center: Dynamic Account Filter Segmented Control */}
        <div className="overflow-x-auto pb-1 md:pb-0">
          <SegmentedControl
            value={selectedAccount}
            onChange={setSelectedAccount}
            options={[
              { id: 'ALL', label: 'Tất cả tài khoản' },
              ...accounts.map((a) => ({ id: a.accountName, label: a.accountName })),
            ]}
          />
        </div>

        {/* Right Actions: Manage Accounts + Export Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAccountModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Building size={14} className="text-slate-500 dark:text-slate-400" />
            <span>Tài khoản & Quỹ ({accounts.length})</span>
          </Button>
          <ExportButton onExport={handleExportCsv} />
        </div>
      </div>

      {/* Sổ quỹ Table */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs min-w-[950px]">
            <thead className="sticky top-0 z-10 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                <th className="px-4 py-3.5">Ngày ghi sổ</th>
                <th className="px-4 py-3.5">Mã chứng từ (Ref)</th>
                <th className="px-4 py-3.5">Tài khoản thanh toán</th>
                <th className="px-4 py-3.5">Đối tượng nộp / nhận</th>
                <th className="px-4 py-3.5">Hạng mục thu chi</th>
                <th className="px-4 py-3.5 text-right">Tiền vào (+)</th>
                <th className="px-4 py-3.5 text-right">Tiền ra (-)</th>
                <th className="px-4 py-3.5 text-right font-bold text-slate-800 dark:text-slate-200">Số dư lũy kế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{new Date(row.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-blue-700 dark:text-blue-400">
                    {row.ref}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Building size={11} className="text-slate-500 dark:text-slate-400" />
                      <span>{row.account}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                    {row.party}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                    {row.category}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold">
                    {row.type === 'IN' ? (
                      <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center justify-end gap-0.5">
                        <ArrowDownLeft size={13} /> +${row.amount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold">
                    {row.type === 'OUT' ? (
                      <span className="text-rose-600 dark:text-rose-400 inline-flex items-center justify-end gap-0.5">
                        <ArrowUpRight size={13} /> -${row.amount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900 dark:text-white font-mono">
                    ${row.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-xs italic">
                    Chưa có bút toán thu chi nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Quản lý Tài khoản & Quỹ */}
      <Modal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setIsAddAccountOpen(false);
        }}
        title="Quản lý Tài khoản Ngân hàng & Quỹ Tiền mặt"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Danh sách các tài khoản ngân hàng và quỹ tiền mặt dùng để đối soát thu chi.
            </p>
            {!isAddAccountOpen && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddAccountOpen(true)}
              >
                <Plus size={14} className="mr-1" /> Thêm tài khoản
              </Button>
            )}
          </div>

          {/* Form thêm tài khoản */}
          {isAddAccountOpen && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">Thêm tài khoản / quỹ mới</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Tên hiển thị (VD: VCB - USD)</label>
                  <Input
                    value={newAccForm.accountName || ''}
                    onChange={(e) => setNewAccForm(p => ({ ...p, accountName: e.target.value }))}
                    placeholder="VD: MB - VND"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Tên ngân hàng / Loại quỹ</label>
                  <Input
                    value={newAccForm.bankName || ''}
                    onChange={(e) => setNewAccForm(p => ({ ...p, bankName: e.target.value }))}
                    placeholder="VD: Quân Đội (MB Bank)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Số tài khoản / Mã quỹ</label>
                  <Input
                    value={newAccForm.accountNumber || ''}
                    onChange={(e) => setNewAccForm(p => ({ ...p, accountNumber: e.target.value }))}
                    placeholder="VD: 0987654321"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Loại tiền tệ</label>
                  <Dropdown
                    options={[
                      { value: 'VND', label: 'VND (Việt Nam Đồng)' },
                      { value: 'USD', label: 'USD (Đô la Mỹ)' },
                    ]}
                    value={newAccForm.currency || 'VND'}
                    onChange={(val) => setNewAccForm(p => ({ ...p, currency: val as 'VND' | 'USD' }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <Button variant="outline" size="sm" onClick={() => setIsAddAccountOpen(false)}>
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!newAccForm.accountName || !newAccForm.bankName) {
                      alert('Vui lòng nhập tên tài khoản và ngân hàng!');
                      return;
                    }
                    saveBankAccount(newAccForm as any);
                    setNewAccForm({
                      accountName: '',
                      accountNumber: '',
                      bankName: '',
                      branch: '',
                      currency: 'VND',
                      initialBalance: 0,
                      isCashFund: false,
                    });
                    setIsAddAccountOpen(false);
                    refreshAccounts();
                  }}
                >
                  Lưu tài khoản
                </Button>
              </div>
            </div>
          )}

          {/* Danh sách tài khoản hiện có */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    acc.isCashFund ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                  }`}>
                    {acc.isCashFund ? <Coins size={18} /> : <Landmark size={18} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{acc.accountName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-300">
                        {acc.currency}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {acc.bankName} {acc.accountNumber && `• STK: ${acc.accountNumber}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                      {acc.currency === 'USD' ? `$${acc.currentBalance.toLocaleString()}` : `${acc.currentBalance.toLocaleString()} ₫`}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">Số dư hiện tại</div>
                  </div>

                  {accounts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Xóa tài khoản ${acc.accountName}?`)) {
                          deleteBankAccount(acc.id);
                          refreshAccounts();
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
                      title="Xóa tài khoản"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
