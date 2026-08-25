import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Download, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import FilterDropdown from '../../components/ui/filter_dropdown.js';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';

export default function CashbookTab() {
  const { t } = useTranslation();
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const requests = await FinancialService.getRequests('');
      
      const ledger: any[] = [];
      let balance = 0;
      
      // We only care about transactions where money has actually moved (paidAmount > 0)
      const paidReqs = requests.filter(r => r.paidAmount > 0);
      
      // Sort ascending to calculate running balance correctly
      paidReqs.sort((a, b) => a.requestDate.localeCompare(b.requestDate));

      paidReqs.forEach(req => {
        if (req.type === 'THU') {
          balance += req.paidAmount;
        } else {
          balance -= req.paidAmount;
        }
        
        ledger.push({
          id: req.id,
          date: req.requestDate, // using requestDate as a proxy for payment date for demo
          ref: req.id,
          type: req.type === 'THU' ? 'IN' : 'OUT',
          account: req.currency === 'VND' ? 'ACB - VND' : 'VCB - USD', // Mock account based on currency
          category: req.category,
          party: req.partyName,
          amount: req.paidAmount,
          balance: balance
        });
      });
      
      // Display newest first
      setData(ledger.reverse());
    };

    loadData();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-slate-200/80 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-2 w-64 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder={t('accounting.cashbook.search', 'Search transactions...')}
            />
          </div>
          <FilterDropdown
            label="Account"
            options={[{label: 'VCB - USD', value: 'vcb_usd'}, {label: 'ACB - VND', value: 'acb_vnd'}]}
            selectedValues={[]}
            onChange={() => {}}
          />
        </div>
        <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          <Download size={16} />
          {t('common.export', 'Export CSV')}
        </button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-50/90 backdrop-blur-md shadow-[0_1px_0_0_#e2e8f0]">
            <tr className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="p-4">Date</th>
              <th className="p-4">Ref No.</th>
              <th className="p-4">Account</th>
              <th className="p-4">Party</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right">Inflow</th>
              <th className="p-4 text-right">Outflow</th>
              <th className="p-4 text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 text-sm text-slate-600 font-medium">{new Date(row.date).toLocaleDateString()}</td>
                <td className="p-4 font-semibold text-slate-800">{row.ref}</td>
                <td className="p-4 text-sm text-slate-500">{row.account}</td>
                <td className="p-4 font-medium text-slate-700">{row.party}</td>
                <td className="p-4 text-sm text-slate-500">{row.category}</td>
                <td className="p-4 text-right">
                  {row.type === 'IN' ? (
                    <span className="font-bold text-emerald-600 flex items-center justify-end gap-1">
                      <ArrowUpRight size={14} /> +${row.amount.toLocaleString()}
                    </span>
                  ) : '-'}
                </td>
                <td className="p-4 text-right">
                  {row.type === 'OUT' ? (
                    <span className="font-bold text-red-600 flex items-center justify-end gap-1">
                      <ArrowDownRight size={14} /> -${row.amount.toLocaleString()}
                    </span>
                  ) : '-'}
                </td>
                <td className="p-4 text-right font-bold text-slate-900">${row.balance.toLocaleString()}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  No recorded transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
