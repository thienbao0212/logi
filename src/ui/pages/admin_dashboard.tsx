import { Users, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const stats = [
    { name: t('admin.totalRevenue', 'Total Revenue'), value: '$124,500', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: t('admin.activeCompanies', 'Active Companies'), value: '12', icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: t('admin.totalUsers', 'Total Users'), value: '48', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: t('admin.systemAlerts', 'System Alerts'), value: '0', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t('nav.adminDashboard', 'Admin Dashboard')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex items-center gap-4">
              <div className={`p-4 rounded-lg ${stat.bg} ${stat.color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('admin.recentActivity', 'Recent Activity')}</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{t('admin.newCompany', 'New company registered: Global Freight Co.')}</p>
                  <p className="text-xs text-slate-500">{i} {t('admin.hoursAgo', 'hour(s) ago')}</p>
                </div>
              </div>
              <button className="text-sm text-blue-600 font-medium hover:underline">{t('admin.viewDetails', 'View Details')}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
