import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Receipt,
  Building,
  Calendar
} from 'lucide-react';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';
import {
  ExportButton,
  SearchInput,
  SegmentedControl,
} from '../../components/common/index.js';

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
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Số dư quỹ hiện tại</span>
            <div className={`text-xl font-bold font-mono mt-1 ${metrics.currentBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              ${metrics.currentBalance.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Tổng tiền mặt & tài khoản ngân hàng</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Wallet size={20} />
          </div>
        </div>

        {/* Card 2: Tổng thu vào */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổng tiền vào (Inflow)</span>
            <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
              +${metrics.totalIn.toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">Tiền thực thu từ khách hàng</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Card 3: Tổng chi ra */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổng tiền ra (Outflow)</span>
            <div className="text-xl font-bold text-rose-700 font-mono mt-1">
              -${metrics.totalOut.toLocaleString()}
            </div>
            <span className="text-[11px] text-rose-600 font-medium mt-0.5 block">Tiền thực chi trả đối tác & dịch vụ</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <TrendingDown size={20} />
          </div>
        </div>

        {/* Card 4: Số lượng giao dịch */}
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Số giao dịch thực tế</span>
            <div className="text-xl font-bold text-slate-900 font-mono mt-1">
              {metrics.count} bút toán
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Đã giải ngân & đối chiếu</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Receipt size={20} />
          </div>
        </div>
      </div>

      {/* Toolbar: Search + Account filter + Export button */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search Box */}
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Tìm theo mã phiếu, đối tượng nộp/nhận, hạng mục..."
          maxWidth="max-w-md"
        />

        {/* Center/Right: Account Filter Segmented Control */}
        <SegmentedControl
          value={selectedAccount}
          onChange={setSelectedAccount}
          options={[
            { id: 'ALL', label: 'Tất cả tài khoản' },
            { id: 'VCB - USD', label: 'VCB - USD' },
            { id: 'ACB - VND', label: 'ACB - VND' },
          ]}
        />

        {/* Export Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <ExportButton onExport={handleExportCsv} />
        </div>
      </div>

      {/* Sổ quỹ Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full custom-scrollbar">
          <table className="w-full text-left border-collapse whitespace-nowrap text-xs min-w-[950px]">
            <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/80">
              <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <th className="px-4 py-3.5">Ngày ghi sổ</th>
                <th className="px-4 py-3.5">Mã chứng từ (Ref)</th>
                <th className="px-4 py-3.5">Tài khoản thanh toán</th>
                <th className="px-4 py-3.5">Đối tượng nộp / nhận</th>
                <th className="px-4 py-3.5">Hạng mục thu chi</th>
                <th className="px-4 py-3.5 text-right">Tiền vào (+)</th>
                <th className="px-4 py-3.5 text-right">Tiền ra (-)</th>
                <th className="px-4 py-3.5 text-right font-bold text-slate-800">Số dư lũy kế</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 text-slate-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{new Date(row.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-blue-700">
                    {row.ref}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      <Building size={11} className="text-slate-500" />
                      <span>{row.account}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    {row.party}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {row.category}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold">
                    {row.type === 'IN' ? (
                      <span className="text-emerald-600 inline-flex items-center justify-end gap-0.5">
                        <ArrowDownLeft size={13} /> +${row.amount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold">
                    {row.type === 'OUT' ? (
                      <span className="text-rose-600 inline-flex items-center justify-end gap-0.5">
                        <ArrowUpRight size={13} /> -${row.amount.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900 font-mono">
                    ${row.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-xs italic">
                    Chưa có bút toán thu chi nào được ghi nhận.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
