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
  CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';
import { FinancialRequest } from '../../components/shipment/tabs/financial/types.js';
import { RequestDrawer } from '../../components/shipment/tabs/financial/components/request_drawer.js';

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
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{kpi.title}</p>
                <h3 className={`text-2xl font-bold font-mono mt-1.5 tracking-tight ${kpi.textColor}`}>{kpi.value}</h3>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.badgeColor}`}>
                <kpi.icon size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-100">
              <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                kpi.isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {kpi.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.trend}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">so với tháng trước</span>
            </div>
          </div>
        ))}
      </div>

      {/* Chart & Action Required Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Biểu đồ Phân tích Dòng tiền (Cashflow)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Đối chiếu tiền thực tế thu vào và chi ra trong các tháng gần nhất</p>
            </div>
          </div>
          
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dx={-10} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', fontSize: '12px'}}
                  formatter={(value: any) => [`$${Number(value || 0).toLocaleString()}`, '']}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '16px', fontSize: '12px'}} />
                <Bar dataKey="Tiền vào (Thu)" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Tiền ra (Chi)" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Required Box (1 Col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Cần xử lý gấp</h3>
            </div>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
              {pendingActions.length} mục
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Các đề nghị chi chờ phê duyệt & chứng từ chờ thu tiền</p>
          
          <div className="space-y-2.5 flex-1 overflow-auto custom-scrollbar pr-1">
            {pendingActions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic">
                <CheckCircle2 size={24} className="text-emerald-500 mb-1" />
                <span>Không có chứng từ nào cần xử lý gấp.</span>
              </div>
            ) : pendingActions.map((req) => {
              const isThu = req.type === 'THU';
              return (
                <div 
                  key={req.id} 
                  onClick={() => setSelectedRequest(req)}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1.5">
                      {isThu ? (
                        <ArrowDownLeft size={13} className="text-emerald-600" />
                      ) : (
                        <ArrowUpRight size={13} className="text-rose-600" />
                      )}
                      <span className="text-xs font-bold text-slate-900 font-mono">{req.id}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      req.status === 'CHỜ DUYỆT' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      req.status === 'CHỜ CHI' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                      'bg-blue-100 text-blue-800 border-blue-300'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 truncate font-medium">{req.partyName}</p>
                  <div className="mt-2 flex justify-between items-center pt-2 border-t border-slate-200/60 text-xs">
                    <span className="font-bold text-slate-900 font-mono">${req.amount.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
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

      {/* Drawer */}
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
