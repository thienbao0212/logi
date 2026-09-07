import { useState, useMemo } from 'react';
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
  DollarSign,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/ui/context/theme_context.js';

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
  const { theme, setTheme } = useTheme();
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

  const [copiedKey, setCopiedKey] = useState(false);

  // Dynamic states for modal interactions persisted in localStorage
  const savedSettings = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('system_settings') || '{}');
    } catch {
      return {};
    }
  }, []);

  const [alertSettings, setAlertSettings] = useState({
    catLaiDelay: true,
    catLaiHours: 24,
    customsHold: true,
    emailNotification: true,
    ...savedSettings.alertSettings,
  });

  const [shipmentSettings, setShipmentSettings] = useState({
    trackingPrefix: 'TRK',
    defaultMode: 'SEA',
    defaultOrigin: 'Shenzhen Port',
    ...savedSettings.shipmentSettings,
  });

  const [companySettings, setCompanySettings] = useState({
    name: 'LogiFlow Corp',
    taxCode: '0318999888',
    address: '123 Nguyen Hue, District 1, HCMC',
    branchHCMC: 'Cat Lai Port Operations Center',
    branchCambodia: 'Phnom Penh River Terminal',
    ...savedSettings.companySettings,
  });

  const [currencySettings, setCurrencySettings] = useState({
    primaryCurrency: 'USD',
    rateVND: 25450,
    rateKHR: 4100,
    ...savedSettings.currencySettings,
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
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/50',
      borderColor: 'border-purple-100 dark:border-purple-900/40',
      titleKey: 'settingsPage.groups.securityIntegrations.title',
      descKey: 'settingsPage.groups.securityIntegrations.description',
      badgeKey: 'settingsPage.groups.securityIntegrations.badge',
      tags: ['JWT Sessions', 'API Keys', 'Hải quan VNACCS'],
    },
    {
      id: 'appearance_theme',
      icon: Palette,
      color: 'text-violet-600 dark:text-violet-400',
      bgColor: 'bg-violet-50 dark:bg-violet-950/50',
      borderColor: 'border-violet-100 dark:border-violet-900/40',
      titleKey: 'settingsPage.groups.appearance.title',
      descKey: 'settingsPage.groups.appearance.description',
      badgeKey: 'settingsPage.groups.appearance.badge',
      tags: ['Light Mode', 'Dark Mode', 'Sáng / Tối', 'Giao diện'],
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
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Sliders size={24} className="text-blue-600" />
              <span>{t('settingsPage.title', 'Cài đặt hệ thống')}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t('settingsPage.subtitle', 'Quản lý và cấu hình các tham số vận hành LogiFlow')}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('settingsPage.searchPlaceholder', 'Tìm kiếm cài đặt...')}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
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
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-8 pb-8 space-y-6">

      {/* KPI Overview Summary - Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Users size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">{t('settingsPage.kpi.users', 'Thành viên')}</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">2 Users <span className="text-[11px] text-slate-400 font-normal">(3 Roles)</span></div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Bell size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">{t('settingsPage.kpi.alertRules', 'Quy tắc cảnh báo')}</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">4 Active <span className="text-[11px] text-slate-400 font-normal">(Realtime)</span></div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <DollarSign size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">{t('settingsPage.kpi.currency', 'Tiền tệ chính')}</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">USD <span className="text-[11px] text-slate-400 font-normal">($ / VND)</span></div>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium">{t('settingsPage.kpi.systemVersion', 'Phiên bản')}</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">v1.2.0 <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Stable</span></div>
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
              className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl border border-slate-200/80 dark:border-slate-800/80 p-4 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                {/* Header: Icon + Title + Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg ${group.bgColor} dark:bg-slate-800 ${group.color} border ${group.borderColor} dark:border-slate-700 shrink-0`}>
                      <Icon size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {t(group.titleKey, group.id)}
                    </h3>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    {t(group.badgeKey, '')}
                  </span>
                </div>

                {/* Subtitle - Short & Concise */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {t(group.descKey, '')}
                </p>

                {/* Compact Tag Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {group.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 text-[11px] font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Bottom: Manage link */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  {activeModalGroup === 'users_roles' && <Users size={18} />}
                  {activeModalGroup === 'shipment_config' && <Package size={18} />}
                  {activeModalGroup === 'alerts_notifications' && <Bell size={18} />}
                  {activeModalGroup === 'company_profile' && <Building2 size={18} />}
                  {activeModalGroup === 'finance_currency' && <Calculator size={18} />}
                  {activeModalGroup === 'security_integrations' && <ShieldCheck size={18} />}
                  {activeModalGroup === 'appearance_theme' && <Palette size={18} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {t(
                      settingGroups.find((g) => g.id === activeModalGroup)?.titleKey || '',
                      'Cài đặt chi tiết'
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {companySettings.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalGroup(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto">
              {/* 1. USERS & ROLES */}
              {activeModalGroup === 'users_roles' && (
                <div className="space-y-3">
                  <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300">
                    Hệ thống có 3 vai trò: <strong>Admin</strong> (Toàn quyền), <strong>Logistics</strong> (Lô hàng, Master Data), <strong>Accountant</strong> (Tài chính).
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    <div className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                          AD
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Admin User</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">admin@logiflow.com</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        ADMIN
                      </span>
                    </div>

                    <div className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                          LG
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Logistic Operator</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500">logistic@logiflow.com</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
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
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Tiền tố mã lô hàng tự động
                    </label>
                    <input
                      type="text"
                      value={shipmentSettings.trackingPrefix}
                      onChange={(e) =>
                        setShipmentSettings({ ...shipmentSettings, trackingPrefix: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono uppercase font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 block">Ví dụ: TRK-928312-402</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phương thức mặc định</label>
                      <select
                        value={shipmentSettings.defaultMode}
                        onChange={(e) => setShipmentSettings({ ...shipmentSettings, defaultMode: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="SEA">Đường biển (SEA)</option>
                        <option value="LAND">Đường bộ (LAND)</option>
                        <option value="AIR">Đường hàng không (AIR)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Điểm xuất phát mặc định</label>
                      <input
                        type="text"
                        value={shipmentSettings.defaultOrigin}
                        onChange={(e) => setShipmentSettings({ ...shipmentSettings, defaultOrigin: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ALERTS & NOTIFICATIONS */}
              {activeModalGroup === 'alerts_notifications' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Cảnh báo trễ Cát Lái ({alertSettings.catLaiHours}h)</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">Lưu bãi quá thời gian quy định tại cảng</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertSettings.catLaiDelay}
                      onChange={(e) => setAlertSettings({ ...alertSettings, catLaiDelay: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Cảnh báo sự cố Hải quan (Customs Hold)</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">Kích hoạt thông báo khi kiểm hóa bị giữ</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertSettings.customsHold}
                      onChange={(e) => setAlertSettings({ ...alertSettings, customsHold: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Thông báo qua Email</div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500">Gửi cập nhật trạng thái tự động qua email</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={alertSettings.emailNotification}
                      onChange={(e) => setAlertSettings({ ...alertSettings, emailNotification: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* 4. COMPANY PROFILE */}
              {activeModalGroup === 'company_profile' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên doanh nghiệp</label>
                      <input
                        type="text"
                        value={companySettings.name}
                        onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã số thuế (MST)</label>
                      <input
                        type="text"
                        value={companySettings.taxCode}
                        onChange={(e) => setCompanySettings({ ...companySettings, taxCode: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Địa chỉ trụ sở</label>
                    <input
                      type="text"
                      value={companySettings.address}
                      onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* 5. FINANCE & CURRENCY */}
              {activeModalGroup === 'finance_currency' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tiền tệ chính</label>
                      <select
                        value={currencySettings.primaryCurrency}
                        onChange={(e) => setCurrencySettings({ ...currencySettings, primaryCurrency: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="VND">VND (₫)</option>
                        <option value="KHR">KHR (៛)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tỷ giá USD/VND</label>
                      <input
                        type="number"
                        value={currencySettings.rateVND}
                        onChange={(e) => setCurrencySettings({ ...currencySettings, rateVND: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tỷ giá USD/KHR</label>
                      <input
                        type="number"
                        value={currencySettings.rateKHR}
                        onChange={(e) => setCurrencySettings({ ...currencySettings, rateKHR: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 6. SECURITY & INTEGRATIONS */}
              {activeModalGroup === 'security_integrations' && (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900/40 text-xs text-purple-700 dark:text-purple-300">
                    Xác thực Access JWT Token (15 phút) kết hợp Refresh Token an toàn.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Khóa API Key</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        readOnly
                        value="logiflow_live_sec_key_9988223311aa"
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('logiflow_live_sec_key_9988223311aa');
                          setCopiedKey(true);
                          setTimeout(() => setCopiedKey(false), 2000);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                          copiedKey
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {copiedKey ? 'Đã chép!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. APPEARANCE & THEMES */}
              {activeModalGroup === 'appearance_theme' && (
                <div className="space-y-4">
                  <div className="p-3 bg-violet-50/60 dark:bg-violet-950/40 rounded-xl border border-violet-100 dark:border-violet-900/40 text-xs text-violet-700 dark:text-violet-300">
                    Tùy biến chế độ hiển thị toàn hệ thống LogiFlow. Cấu hình được lưu tự động trên thiết bị này.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Light Mode Card */}
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                        theme === 'light'
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                          <Sun size={18} />
                        </div>
                        {theme === 'light' && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} /> Đang chọn
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Chế độ Sáng (Light Mode)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Tông sáng thanh thoát, tối ưu hiển thị rõ ràng chứng từ vận tải ban ngày.
                      </p>
                    </button>

                    {/* Dark Mode Card */}
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                        theme === 'dark'
                          ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-slate-800 text-slate-200">
                          <Moon size={18} />
                        </div>
                        {theme === 'dark' && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800/60">
                            <CheckCircle2 size={12} /> Đang chọn
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Chế độ Tối (Dark Mode)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Tông tối obsidian sang trọng, giảm mỏi mắt và bảo vệ thị lực khi làm việc ban đêm.
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModalGroup(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {t('settingsPage.close', 'Đóng')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const toSave = { alertSettings, shipmentSettings, companySettings, currencySettings };
                  localStorage.setItem('system_settings', JSON.stringify(toSave));
                  setActiveModalGroup(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 size={14} />
                <span>{t('settingsPage.saveChanges', 'Lưu thay đổi')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
