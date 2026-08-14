import { DollarSign, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';

interface Shipment {
  id: string;
  trackingNumber: string;
  status: string;
  mode: string;
  weightTotal?: string;
  volumeTotal?: string;
  customerId: string;
  originId: string;
  destinationId: string;
  estimatedDepartureDate?: string;
  estimatedArrivalDate?: string;
  actualDepartureDate?: string;
  actualArrivalDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface FinancialTabProps {
  shipment: Shipment;
}

interface LineItem {
  type: string;
  amount: number;
  currency: string;
}

const REVENUE_ITEMS: LineItem[] = [
  { type: 'Customer Freight', amount: 7500, currency: 'USD' },
  { type: 'Customs Service Fee', amount: 2500, currency: 'USD' },
  { type: 'Trucking Fee', amount: 1800, currency: 'USD' },
  { type: 'Documentation Fee', amount: 700, currency: 'USD' },
];

const COST_ITEMS: LineItem[] = [
  { type: 'Ocean Freight', amount: 4200, currency: 'USD' },
  { type: 'Cat Lai Charges', amount: 850, currency: 'USD' },
  { type: 'Customs Fee', amount: 650, currency: 'USD' },
  { type: 'Trucking Vietnam', amount: 900, currency: 'USD' },
  { type: 'Cambodia Trucking', amount: 1200, currency: 'USD' },
  { type: 'Documentation', amount: 350, currency: 'USD' },
  { type: 'Handling', amount: 600, currency: 'USD' },
];

function formatUSD(amount: number): string {
  return amount.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

function LineTable({
  title,
  icon,
  items,
  totalColor,
}: {
  title: string;
  icon: React.ReactNode;
  items: LineItem[];
  totalColor: string;
}) {
  const total = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <span className="text-slate-500">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Type</th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
              <th className="text-right px-5 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">Currency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr key={item.type} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-2.5 text-slate-700">{item.type}</td>
                <td className="px-5 py-2.5 text-right font-mono text-slate-700">${formatUSD(item.amount)}</td>
                <td className="px-5 py-2.5 text-right text-slate-400 text-xs">{item.currency}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="px-5 py-3 font-semibold text-slate-700">Total</td>
              <td className={`px-5 py-3 text-right font-bold font-mono text-base ${totalColor}`}>
                ${formatUSD(total)}
              </td>
              <td className="px-5 py-3 text-right text-xs text-slate-400">USD</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function SummaryCard() {
  const totalRevenue = REVENUE_ITEMS.reduce((s, i) => s + i.amount, 0);
  const totalCost = COST_ITEMS.reduce((s, i) => s + i.amount, 0);
  const grossProfit = totalRevenue - totalCost;
  const margin = Math.round((grossProfit / totalRevenue) * 100);
  const outstanding = 2500;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50">
        <BarChart2 size={16} className="text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Summary</h3>
      </div>

      <div className="px-5 py-4 space-y-4 flex-1">
        {/* Revenue */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-green-500" />
            <span className="text-sm text-slate-600">Revenue</span>
          </div>
          <span className="font-mono font-semibold text-green-600">${formatUSD(totalRevenue)}</span>
        </div>

        {/* Cost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown size={15} className="text-red-500" />
            <span className="text-sm text-slate-600">Cost</span>
          </div>
          <span className="font-mono font-semibold text-red-600">${formatUSD(totalCost)}</span>
        </div>

        <div className="border-t border-slate-100 pt-4">
          {/* Gross Profit */}
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-0.5">Gross Profit</p>
            <p className="text-2xl font-bold font-mono text-blue-600">${formatUSD(grossProfit)}</p>
            <p className="text-xs text-slate-400 mt-0.5">USD</p>
          </div>

          {/* Margin */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">Profit Margin</span>
              <span className="text-sm font-bold text-blue-700">{margin}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${margin}%` }}
              />
            </div>
          </div>

          {/* Outstanding */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-amber-600" />
              <span className="text-sm text-amber-700 font-medium">Outstanding</span>
            </div>
            <span className="font-mono font-bold text-amber-700">${formatUSD(outstanding)}</span>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="pt-2">
          <p className="text-xs text-slate-400 mb-2">Revenue Breakdown</p>
          {REVENUE_ITEMS.map((item) => (
            <div key={item.type} className="mb-2">
              <div className="flex justify-between text-xs text-slate-500 mb-0.5">
                <span>{item.type}</span>
                <span>{Math.round((item.amount / totalRevenue) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-indigo-400 h-1.5 rounded-full"
                  style={{ width: `${(item.amount / totalRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FinancialTab({ shipment: _shipment }: FinancialTabProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <DollarSign size={18} className="text-slate-500" />
        <h2 className="text-base font-semibold text-slate-800">Financial Overview</h2>
        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
          Mock Data
        </span>
      </div>

      {/* Three column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <LineTable
          title="Revenue"
          icon={<TrendingUp size={16} />}
          items={REVENUE_ITEMS}
          totalColor="text-green-600"
        />
        <LineTable
          title="Cost"
          icon={<TrendingDown size={16} />}
          items={COST_ITEMS}
          totalColor="text-red-600"
        />
        <SummaryCard />
      </div>
    </div>
  );
}
