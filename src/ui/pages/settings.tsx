import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Package,
  Bell,
  Building2,
  Calculator,
  ShieldCheck,
  Search,
  ChevronRight,
  CheckCircle2,
  X,
  Sliders,
  Sparkles,
  DollarSign
} from 'lucide-react';

interface SettingGroup {
  id: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  titleKey: string;
  descKey: string;
  badgeKey: string;
  tags: string[];
}

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeModalGroup, setActiveModalGroup] = useState<string | null>(null);

  const handleCardClick = (groupId: string) => {
    if (groupId === 'shipment_config') {
      navigate('/settings/shipments');
      return;
    }
    setActiveModalGroup(groupId);
  };

  // Dynamic states for modal interactions
  const [alertSettings, setAlertSettings] = useState({
    catLaiDelay: true,
    catLaiHours: 24,
    customsHold: true,
    emailNotification: true,
  });

  const [shipmentSettings, setShipmentSettings] = useState({
    trackingPrefix: 'TRK',
    defaultMode: 'SEA',
    defaultOrigin: 'Shenzhen Port',
  });

  const [companySettings, setCompanySettings] = useState({
    name: 'LogiFlow Corp',
    taxCode: '0318999888',
    address: '123 Nguyen Hue, District 1, HCMC',
    branchHCMC: 'Cat Lai Port Operations Center',
    branchCambodia: 'Phnom Penh River Terminal',
  });

  const [currencySettings, setCurrencySettings] = useState({
    primaryCurrency: 'USD',
    rateVND: 25450,
    rateKHR: 4100,
  });

  const settingGroups: SettingGroup[] = [
    {
      id: 'users_roles',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      titleKey: 'settingsPage.groups.usersRoles.title',
      descKey: 'settingsPage.groups.usersRoles.description',
      badgeKey: 'settingsPage.groups.usersRoles.badge',
      tags: ['Admin', 'Logistics', 'Accountant', 'RBAC'],
    },
    {
      id: 'shipment_config',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      titleKey: 'settingsPage.groups.shipmentConfig.title',
      descKey: 'settingsPage.groups.shipmentConfig.description',
      badgeKey: 'settingsPage.groups.shipmentConfig.badge',
      tags: ['TRK Auto-Code', '14 Stages', 'Định mức 6 Phí', 'POL / POD'],
    },
    {
      id: 'alerts_notifications',
      icon: Bell,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      titleKey: 'settingsPage.groups.alertsNotifications.title',
      descKey: 'settingsPage.groups.alertsNotifications.description',
      badgeKey: 'settingsPage.groups.alertsNotifications.badge',
      tags: ['Trễ Cát Lái >24h', 'Customs Hold', 'Email Alert'],
    },
    {
      id: 'company_profile',
      icon: Building2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      titleKey: 'settingsPage.groups.companyProfile.title',
      descKey: 'settingsPage.groups.companyProfile.description',
      badgeKey: 'settingsPage.groups.companyProfile.badge',
      tags: ['LogiFlow Corp', 'MST: 0318999888', 'TP.HCM / Phnom Penh'],
    },
    {
      id: 'finance_currency',
      icon: Calculator,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-100',
      titleKey: 'settingsPage.groups.financeCurrency.title',
      descKey: 'settingsPage.groups.financeCurrency.description',
      badgeKey: 'settingsPage.groups.financeCurrency.badge',
      tags: ['USD / VND / KHR', 'Tỷ giá hạch toán', 'Danh mục Thu/Chi'],
    },
    {
      id: 'security_integrations',
      icon: ShieldCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      titleKey: 'settingsPage.groups.securityIntegrations.title',
      descKey: 'settingsPage.groups.securityIntegrations.description',
      badgeKey: 'settingsPage.groups.securityIntegrations.badge',
      tags: ['JWT Sessions', 'API Keys', 'Hải quan VNACCS'],
    },
  ];

  const filteredGroups = settingGroups.filter((g) => {
    const title = t(g.titleKey, '').toLowerCase();
    const desc = t(g.descKey, '').toLowerCase();
    const query = search.toLowerCase().trim();
    return (
      title.includes(query) ||
      desc.includes(query) ||
      g.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 text-white shadow-sm">
              <Sliders size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t('settingsPage.title', 'Cài đặt hệ thống')}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('settingsPage.subtitle', 'Quản lý và cấu hình các tham số vận hành LogiFlow')}
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('settingsPage.searchPlaceholder', 'Tìm kiếm nhóm cài đặt...')}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Summary - Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">{t('settingsPage.kpi.users', 'Thành viên')}</div>
            <div className="text-sm font-bold text-slate-900">2 Users <span className="text-[11px] text-slate-400 font-normal">(3 Roles)</span></div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Bell size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">{t('settingsPage.kpi.alertRules', 'Quy tắc cảnh báo')}</div>
            <div className="text-sm font-bold text-emerald-600">4 Active <span className="text-[11px] text-slate-400 font-normal">(Realtime)</span></div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
            <DollarSign size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">{t('settingsPage.kpi.currency', 'Tiền tệ chính')}</div>
            <div className="text-sm font-bold text-slate-900">USD <span className="text-[11px] text-slate-400 font-normal">($ / VND)</span></div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">{t('settingsPage.kpi.systemVersion', 'Phiên bản')}</div>
            <div className="text-sm font-bold text-slate-900">v1.2.0 <span className="text-[11px] text-emerald-600 font-medium">Stable</span></div>
          </div>
        </div>
      </div>

      {/* Setting Cards Grid - Concise & Clean Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div
              key={group.id}
              onClick={() => handleCardClick(group.id)}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                {/* Header: Icon + Title + Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg ${group.bgColor} ${group.color} border ${group.borderColor} shrink-0`}>
                      <Icon size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {t(group.titleKey, group.id)}
                    </h3>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 shrink-0">
                    {t(group.badgeKey, '')}
                  </span>
                </div>

                {/* Subtitle - Short & Concise */}
                <p className="text-xs text-slate-500 line-clamp-1">
                  {t(group.descKey, '')}
                </p>

                {/* Compact Tag Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-100 text-[11px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Bottom: Manage link */}
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                <span>{t('settingsPage.manage', 'Cấu hình')}</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Settings Detail Modal */}
      {activeModalGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  {activeModalGroup === 'users_roles' && <Users size={18} />}
                  {activeModalGroup === 'shipment_config' && <Package size={18} />}
                  {activeModalGroup === 'alerts_notifications' && <Bell size={18} />}
                  {activeModalGroup === 'company_profile' && <Building2 size={18} />}
                  {activeModalGroup === 'finance_currency' && <Calculator size={18} />}
                  {activeModalGroup === 'security_integrations' && <ShieldCheck size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t(
                      settingGroups.find((g) => g.id === activeModalGroup)?.titleKey || '',
                      'Cài đặt chi tiết'
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {companySettings.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalGroup(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* 1. USERS & ROLES */}
              {activeModalGroup === 'users_roles' && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-700">
                    Hệ thống có 3 vai trò: <strong>Admin</strong> (Toàn quyền), <strong>Logistics</strong> (Lô hàng, Master Data), <strong>Accountant</strong> (Tài chính).
                  </div>

                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                    <div className="p-3 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                          AD
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">Admin User</div>
                          <div className="text-[11px] text-slate-400">admin@logiflow.com</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        ADMIN
                      </span>
                    </div>

                    <div className="p-3 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                          LG
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">Logistic Operator</div>
                          <div className="text-[11px] text-slate-400">logistic@logiflow.com</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        LOGISTICS
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SHIPMENT CONFIG */}
              {activeModalGroup === 'shipment_config' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tiền tố mã vận đơn tự động
                    </label>
                    <input
                      type="text"
                      value={shipmentSettings.trackingPrefix}
                      onChange={(e) =>
                        setShipmentSettings({ ...shipmentSettings, trackingPrefix: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono uppercase font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-[11px] text-slate-400 mt-0.5 block">Ví dụ: TRK-928312-402</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phương thức mặc định</label>
                      <select
                        value={shipmentSettings.defaultMode}
                        onChange={(e) => setShipmentSettings({ ...shipmentSettings, defaultMode: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="SEA">Đường biển (SEA)</option>
                        <option value="LAND">Đường bộ (LAND)</option>
                        <option value="AIR">Đường hàng không (AIR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Điểm xuất phát mặc định</label>
                      <input
                        type="text"
                        value={shipmentSettings.defaultOrigin}
                        onChange={(e) => setShipmentSettings({ ...shipmentSettings, defaultOrigin: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ALERTS & NOTIFICATIONS */}
              {activeModalGroup === 'alerts_notifications' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Cảnh báo trễ Cát Lái ({alertSettings.catLaiHours}h)</div>
                      <div className="text-[11px] text-slate-400">Lưu bãi quá thời gian quy định tại cảng</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertSettings.catLaiDelay}
                      onChange={(e) => setAlertSettings({ ...alertSettings, catLaiDelay: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Cảnh báo sự cố Hải quan (Customs Hold)</div>
                      <div className="text-[11px] text-slate-400">Kích hoạt thông báo khi kiểm hóa bị giữ</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertSettings.customsHold}
                      onChange={(e) => setAlertSettings({ ...alertSettings, customsHold: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white">
                    <div>
                      <div className="text-xs font-semibold text-slate-900">Thông báo qua Email</div>
                      <div className="text-[11px] text-slate-400">Gửi cập nhật trạng thái tự động qua email</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertSettings.emailNotification}
                      onChange={(e) => setAlertSettings({ ...alertSettings, emailNotification: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* 4. COMPANY PROFILE */}
              {activeModalGroup === 'company_profile' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tên doanh nghiệp</label>
                      <input
                        type="text"
                        value={companySettings.name}
                        onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mã số thuế (MST)</label>
                      <input
                        type="text"
                        value={companySettings.taxCode}
                        onChange={(e) => setCompanySettings({ ...companySettings, taxCode: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ trụ sở</label>
                    <input
                      type="text"
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* 5. FINANCE & CURRENCY */}
              {activeModalGroup === 'finance_currency' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tiền tệ chính</label>
                      <select
                        value={currencySettings.primaryCurrency}
                        onChange={(e) => setCurrencySettings({ ...currencySettings, primaryCurrency: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="VND">VND (₫)</option>
                        <option value="KHR">KHR (៛)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tỷ giá USD/VND</label>
                      <input
                        type="number"
                        value={currencySettings.rateVND}
                        onChange={(e) => setCurrencySettings({ ...currencySettings, rateVND: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tỷ giá USD/KHR</label>
                      <input
                        type="number"
                        value={currencySettings.rateKHR}
                        onChange={(e) => setCurrencySettings({ ...currencySettings, rateKHR: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. SECURITY & INTEGRATIONS */}
              {activeModalGroup === 'security_integrations' && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-700">
                    Xác thực Access JWT Token (15 phút) kết hợp Refresh Token an toàn.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Khóa API Key</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        readOnly
                        value="logiflow_live_sec_key_9988223311aa"
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600"
                      />
                      <button
                        onClick={() => alert('API Key đã được sao chép')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModalGroup(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                {t('settingsPage.close', 'Đóng')}
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Cài đặt đã được cập nhật!');
                  setActiveModalGroup(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                <CheckCircle2 size={14} />
                <span>{t('settingsPage.saveChanges', 'Lưu thay đổi')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
