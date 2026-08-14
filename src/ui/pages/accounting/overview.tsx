import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FinancialService } from '../../components/shipment/tabs/financial/mockService.js';
import { FinancialRequest } from '../../components/shipment/tabs/financial/types.js';

export default function OverviewTab() {
  const { t } = useTranslation();
  const [kpiData, setKpiData] = useState({
    revenue: 0,
    expenses: 0,
    grossProfit: 0,
    cashBalance: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [pendingActions, setPendingActions] = useState<FinancialRequest[]>([]);

  useEffect(() => {
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
          cashIn += req.paidAmount;
        } else {
          exp += req.amount;
          cashOut += req.paidAmount;
        }

        // Aggregate for chart
        const month = req.requestDate.substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { Inflow: 0, Outflow: 0 };
        }
        if (req.type === 'THU') {
          monthlyData[month].Inflow += req.amount;
        } else {
          monthlyData[month].Outflow += req.amount;
        }
      });

      setKpiData({
        revenue: rev,
        expenses: exp,
        grossProfit: rev - exp,
        cashBalance: cashIn - cashOut
      });

      const formattedChartData = Object.keys(monthlyData).sort().map(month => ({
        name: month,
        Inflow: monthlyData[month].Inflow,
        Outflow: monthlyData[month].Outflow
      }));
      setChartData(formattedChartData.slice(-6)); // last 6 months

      const pending = requests.filter(r => ['CHỜ DUYỆT', 'CHỜ THU', 'CHỜ CHI'].includes(r.status));
      setPendingActions(pending);
    };

    loadData();
  }, []);

  const kpis = [
    {
      title: t('accounting.overview.totalRevenue', 'Total Revenue'),
      value: `$${kpiData.revenue.toLocaleString()}`,
      trend: '+12.5%',
      isPositive: true,
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: t('accounting.overview.totalExpenses', 'Total Expenses'),
      value: `$${kpiData.expenses.toLocaleString()}`,
      trend: '+4.2%',
      isPositive: false,
      icon: TrendingDown,
      color: 'red'
    },
    {
      title: t('accounting.overview.grossProfit', 'Gross Profit'),
      value: `$${kpiData.grossProfit.toLocaleString()}`,
      trend: '+8.1%',
      isPositive: true,
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: t('accounting.overview.cashBalance', 'Cash Balance'),
      value: `$${kpiData.cashBalance.toLocaleString()}`,
      trend: '+2.4%',
      isPositive: true,
      icon: Wallet,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{kpi.value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600`}>
                <kpi.icon size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md ${
                kpi.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
              }`}>
                {kpi.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {kpi.trend}
              </span>
              <span className="text-xs text-slate-400 font-medium">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-slate-900">{t('accounting.overview.cashflow', 'Cashflow Analysis')}</h3>
          <p className="text-sm text-slate-500 mb-6">Inflow vs Outflow over the last 6 months</p>
          
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="Inflow" name={t('accounting.cashbook.inflow', 'Inflow')} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Outflow" name={t('accounting.cashbook.outflow', 'Outflow')} fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Action Required */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-slate-900">{t('accounting.overview.actionRequired', 'Action Required')}</h3>
          <p className="text-sm text-slate-500 mb-6">Pending approvals and payments</p>
          
          <div className="space-y-3 flex-1 overflow-auto custom-scrollbar pr-2">
            {pendingActions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No pending actions.
              </div>
            ) : pendingActions.map((req) => (
              <div key={req.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/80 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-semibold text-slate-800">{req.id}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${req.status === 'CHỜ DUYỆT' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">{req.partyName}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900">${req.amount.toLocaleString()}</span>
                  <button className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Review <ArrowUpRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
