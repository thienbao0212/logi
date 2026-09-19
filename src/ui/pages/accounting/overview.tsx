import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  Clock,
  ArrowDownLeft,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';
import { FinancialRequest } from '../../components/shipment/tabs/financial/types.js';
import { RequestDrawer } from '../../components/shipment/tabs/financial/components/request_drawer.js';
import { ExpenseService, OperatingExpense } from './expense_service.js';
import { Card, Badge } from '../../components/common/index.js';

export default function OverviewTab() {
  const [kpiData, setKpiData] = useState({
    revenue: 0,
    expenses: 0,
    grossProfit: 0,
    cashBalance: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<FinancialRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<FinancialRequest | null>(null);
  const [operatingExpenses, setOperatingExpenses] = useState<OperatingExpense[]>([]);

  const loadData = async () => {
    const requests = await FinancialService.getRequests('');
    
    let rev = 0;
    let exp = 0;
    let cashIn = 0;
    let cashOut = 0;

    const monthlyData: Record<string, { Inflow: number, Outflow: number }> = {};

    requests.forEach(req => {
      if (req.type === 'THU') {
        rev += req.amount;
        cashIn += (req.paidAmount || 0);
      } else {
        exp += req.amount;
        cashOut += (req.paidAmount || 0);
      }

      // Aggregate for chart
      const month = (req.requestDate || '').substring(0, 7) || '2026-08';
      if (!monthlyData[month]) {
        monthlyData[month] = { Inflow: 0, Outflow: 0 };
      }
      if (req.type === 'THU') {
        monthlyData[month].Inflow += (req.paidAmount || req.amount);
      } else {
        monthlyData[month].Outflow += (req.paidAmount || req.amount);
      }
    });

    setKpiData({
      revenue: rev,
      expenses: exp,
      grossProfit: rev - exp,
      cashBalance: cashIn - cashOut
    });

    const formattedChartData = Object.keys(monthlyData).sort().map(month => ({
      name: `Thg ${month.split('-')[1]}`,
      'Tiền vào (Thu)': monthlyData[month].Inflow,
      'Tiền ra (Chi)': monthlyData[month].Outflow
    }));
    setChartData(formattedChartData.slice(-6));

    const pending = requests.filter(r => ['CHỜ DUYỆT', 'CHỜ THU', 'CHỜ CHI'].includes(r.status));
    setPendingActions(pending);

    try {
      const opexList = ExpenseService.getAll();
      setOperatingExpenses(opexList);
    } catch {
      setOperatingExpenses([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const kpis = [
    {
      title: 'Tổng công nợ phải thu',
      value: `$${kpiData.revenue.toLocaleString()}`,
      trend: '+12.5%',
      isPositive: true,
      icon: TrendingUp,
      badgeColor: 'bg-blue-50 text-blue-600 border border-blue-100',
      textColor: 'text-blue-700'
    },
    {
      title: 'Tổng công nợ phải chi',
      value: `$${kpiData.expenses.toLocaleString()}`,
      trend: '+4.2%',
      isPositive: false,
      icon: TrendingDown,
      badgeColor: 'bg-rose-50 text-rose-600 border border-rose-100',
      textColor: 'text-rose-700'
    },
    {
      title: 'Chênh lệch Thu - Chi (Lãi gộp)',
      value: `$${kpiData.grossProfit.toLocaleString()}`,
      trend: '+8.1%',
      isPositive: true,
      icon: DollarSign,
      badgeColor: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      textColor: 'text-emerald-700'
    },
    {
      title: 'Số dư quỹ thực tế',
      value: `$${kpiData.cashBalance.toLocaleString()}`,
      trend: '+2.4%',
      isPositive: true,
      icon: Wallet,
      badgeColor: 'bg-purple-50 text-purple-600 border border-purple-100',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{kpi.title}</p>
                <h3 className={`text-2xl font-bold font-mono mt-1.5 tracking-tight ${kpi.textColor}`}>{kpi.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.badgeColor}`}>
                <kpi.icon size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                kpi.isPositive ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60'
              }`}>
                {kpi.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.trend}
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">so với tháng trước</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Action Required Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl p-6 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Biểu đồ Phân tích Dòng tiền (Cashflow)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Đối chiếu tiền thực tế thu vào và chi ra trong các tháng gần nhất</p>
            </div>
          </div>
          
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dx={-10} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  cursor={{fill: 'rgba(148, 163, 184, 0.08)'}}
                  contentStyle={{borderRadius: '12px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)', fontSize: '12px'}}
                  formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '16px', fontSize: '12px'}} />
                <Bar dataKey="Tiền vào (Thu)" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Tiền ra (Chi)" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Required Box (1 Col) */}
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-xl p-6 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Cần xử lý gấp</h3>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold rounded-full">
              {pendingActions.length} mục
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Các đề nghị chi chờ phê duyệt & chứng từ chờ thu tiền</p>
          
          <div className="space-y-2.5 flex-1 overflow-auto custom-scrollbar pr-1">
            {pendingActions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs italic">
                <CheckCircle2 size={24} className="text-emerald-500 mb-1" />
                <span>Không có chứng từ nào cần xử lý gấp.</span>
              </div>
            ) : pendingActions.map((req) => {
              const isThu = req.type === 'THU';
              return (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 hover:border-blue-200 dark:hover:border-blue-700/60 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1.5">
                      {isThu ? (
                        <ArrowDownLeft size={13} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <ArrowUpRight size={13} className="text-rose-600 dark:text-rose-400" />
                      )}
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">{req.id}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      req.status === 'CHỜ DUYỆT' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700' :
                      req.status === 'CHỜ CHI' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700' :
                      'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate font-medium">{req.partyName}</p>
                  <div className="mt-2 flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white font-mono">${req.amount.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock size={11} />
                      <span>{req.expectedDate}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Executive Income Statement (Báo cáo Kết quả Kinh doanh Hợp nhất) */}
      {(() => {
        const totalOpexVND = operatingExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const totalOpexUSD = Math.round(totalOpexVND / 25400);
        const netProfit = kpiData.grossProfit - totalOpexUSD;
        const grossMargin = kpiData.revenue > 0 ? ((kpiData.grossProfit / kpiData.revenue) * 100).toFixed(1) : '0';
        const netMargin = kpiData.revenue > 0 ? ((netProfit / kpiData.revenue) * 100).toFixed(1) : '0';

        return (
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-900/40">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Báo cáo Kết quả Kinh doanh Tổng thể (Executive P&L Statement)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hợp nhất Doanh thu vận tải, Giá vốn dịch vụ trực tiếp & Chi phí vận hành doanh nghiệp (OPEX)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="info">Tỷ giá quy đổi: 25,400 VND/USD</Badge>
                <Badge variant={Number(netMargin) >= 0 ? 'success' : 'danger'}>
                  Biên lợi nhuận ròng: {netMargin}%
                </Badge>
              </div>
            </div>

            {/* Visual P&L Waterfall Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">1. Doanh thu dịch vụ (Revenue)</div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                  ${kpiData.revenue.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Cước bán & Phụ phí thu KH</div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40">
                <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">2. Giá vốn trực tiếp (COGS)</div>
                <div className="text-xl font-bold font-mono text-rose-700 dark:text-rose-400 mt-1">
                  -${kpiData.expenses.toLocaleString()}
                </div>
                <div className="text-[11px] text-rose-500 dark:text-rose-400/80 mt-1">Hãng tàu, Cảng, Xe kéo, Hải quan</div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
                <div className="text-xs text-amber-700 dark:text-amber-400 font-medium">3. Chi phí vận hành (OPEX)</div>
                <div className="text-xl font-bold font-mono text-amber-800 dark:text-amber-400 mt-1">
                  -${totalOpexUSD.toLocaleString()}
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-1">
                  {totalOpexVND.toLocaleString('vi-VN')} ₫ (Lương, văn phòng...)
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${
                netProfit >= 0 ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50' : 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/50'
              }`}>
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">4. Lợi nhuận thuần (Net Income)</div>
                <div className={`text-xl font-bold font-mono mt-1 ${
                  netProfit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                }`}>
                  ${netProfit.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Biên lãi ròng: <span className="font-bold">{netMargin}%</span>
                </div>
              </div>
            </div>

            {/* Detailed P&L Rows */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Chỉ tiêu tài chính</th>
                    <th className="py-2.5 px-4 text-right">Giá trị quy đổi (USD)</th>
                    <th className="py-2.5 px-4 text-right">Tỷ trọng (% Doanh thu)</th>
                    <th className="py-2.5 px-4">Tính chất hạch toán</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr className="bg-white dark:bg-slate-900/50 font-medium">
                    <td className="py-2.5 px-4 text-slate-900 dark:text-slate-100 font-semibold">
                      [+] Tổng doanh thu dịch vụ Logistics (AR)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      ${kpiData.revenue.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">100.0%</td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">Hóa đơn & Báo giá vận đơn đã phát hành</td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-900/50 text-rose-700 dark:text-rose-400">
                    <td className="py-2.5 px-4 font-medium pl-8">
                      [-] Chi phí trực tiếp lô hàng (Direct Operating Costs / AP)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      -${kpiData.expenses.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {kpiData.revenue > 0 ? ((kpiData.expenses / kpiData.revenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">Thanh toán hãng vận chuyển, cảng, thủ tục</td>
                  </tr>
                  <tr className="bg-emerald-50/50 dark:bg-emerald-950/30 font-bold text-emerald-900 dark:text-emerald-300">
                    <td className="py-2.5 px-4">
                      [=] Lợi nhuận gộp dịch vụ (Gross Logistics Profit)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      ${kpiData.grossProfit.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400">{grossMargin}%</td>
                    <td className="py-2.5 px-4 text-emerald-800 dark:text-emerald-300">Biên lợi nhuận gộp vận hành</td>
                  </tr>
                  <tr className="bg-white dark:bg-slate-900/50 text-amber-800 dark:text-amber-400">
                    <td className="py-2.5 px-4 font-medium pl-8">
                      [-] Chi phí quản lý doanh nghiệp (OPEX / Overhead)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      -${totalOpexUSD.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {kpiData.revenue > 0 ? ((totalOpexUSD / kpiData.revenue) * 100).toFixed(1) : 0}%
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">Chi lương nhân sự, mặt bằng, viễn thông</td>
                  </tr>
                  <tr className="bg-slate-900 dark:bg-slate-950 text-white font-bold text-sm border-t border-slate-800">
                    <td className="py-3 px-4">
                      [★] LỢI NHUẬN THUẦN DOANH NGHIỆP TRƯỚC THUẾ (EBITDA)
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold ${
                      netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      ${netProfit.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">{netMargin}%</td>
                    <td className="py-3 px-4 text-slate-400 font-normal text-xs">Hiệu quả kinh doanh thực</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        );
      })()}
      {selectedRequest && (
        <RequestDrawer
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdateStatus={async (id, status) => {
            await FinancialService.updateRequestStatus(id, status);
            await loadData();
            const reqs = await FinancialService.getRequests('');
            const updated = reqs.find(r => r.id === id);
            if (updated) setSelectedRequest(updated);
          }}
          onRecordPayment={async (id, amount) => {
            await FinancialService.recordPayment(id, amount);
            await loadData();
            const reqs = await FinancialService.getRequests('');
            const updated = reqs.find(r => r.id === id);
            if (updated) setSelectedRequest(updated);
          }}
          onUpdateNote={async (id, note) => {
            await FinancialService.updateRequestStatus(id, selectedRequest.status, { notes: note });
            await loadData();
            const reqs = await FinancialService.getRequests('');
            const updated = reqs.find(r => r.id === id);
            if (updated) setSelectedRequest(updated);
          }}
        />
      )}
    </div>
  );
}
