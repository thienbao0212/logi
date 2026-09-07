import { apiFetch } from '@/lib/fetch.js';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, 
  LogOut, 
  LayoutDashboard, 
  Settings, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  Globe, 
  Calculator,
  Database,
  Users,
  Ship,
  Anchor,
  BarChart3,
  Truck,
  Receipt,
  Sun,
  Moon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/ui/context/theme_context.js';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
  const isAdmin = memberships.some((m: any) => m.role === 'admin');
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  
  // Shipments submenu toggle state
  const isShipmentsActive = location.pathname.startsWith('/shipments');
  const [shipmentsOpen, setShipmentsOpen] = useState(true);

  // Master data submenu toggle state
  const isMasterDataActive = location.pathname.startsWith('/master-data');
  const [masterDataOpen, setMasterDataOpen] = useState(true);

  useEffect(() => {
    if (isShipmentsActive) {
      setShipmentsOpen(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isMasterDataActive) {
      setMasterDataOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('memberships');
    navigate('/login');
  };

  const shipmentsChildren = [
    { 
      name: t('nav.shipmentManagement', 'Quản lý lô hàng'), 
      path: '/shipments', 
      icon: Package,
      isActive: (pathname: string) => pathname === '/shipments' || (pathname.startsWith('/shipments/') && !pathname.startsWith('/shipments/financial'))
    },
    { 
      name: t('nav.shipmentFinancial', 'Tài chính lô hàng'), 
      path: '/shipments/financial', 
      icon: BarChart3,
      isActive: (pathname: string) => pathname.startsWith('/shipments/financial')
    },
  ];

  const masterDataChildren = [
    { name: t('nav.customers', 'Khách hàng'), path: '/master-data/customers', icon: Users },
    { name: t('nav.vendors', 'Nhà cung cấp'), path: '/master-data/vendors', icon: Truck },
    { name: t('nav.charges', 'Biểu phí'), path: '/master-data/charges', icon: Receipt },
    { name: t('nav.shippingLines', 'Hãng tàu'), path: '/master-data/shipping-lines', icon: Ship },
    { name: t('nav.ports', 'Cảng biển'), path: '/master-data/ports', icon: Anchor },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 shrink-0 z-10 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Package size={20} />
          </div>
          {/* Logo text fades out when collapsed */}
          <span
            style={{
              maxWidth: collapsed ? '0px' : '160px',
              opacity: collapsed ? 0 : 1,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'max-width 300ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease',
            }}
            className="font-bold text-slate-900 dark:text-white tracking-tight text-lg"
          >
            LogiFlow
          </span>
        </div>

        {/* Dynamic header content injected from pages via Portal */}
        <div id="app-header-extra" className="flex-1 flex justify-start items-center pl-6 pr-4 overflow-hidden min-w-0" />

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={19} className="text-amber-400 hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon size={19} className="text-slate-600 dark:text-slate-400 hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors px-2.5 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs font-semibold"
            title="Switch Language"
          >
            <Globe size={18} />
            <span className="uppercase">{i18n.language === 'vi' ? 'EN' : 'VI'}</span>
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-transparent dark:border-slate-700/60">
            <User size={15} className="text-slate-500 dark:text-slate-400" />
            <span className="text-xs sm:text-sm font-medium">{user.firstName} {user.lastName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            title="Log out"
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar + resize handle wrapper */}
        <div
          style={{
            width: collapsed ? '64px' : '256px',
            transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          {/* Sidebar */}
          <aside
            className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col overflow-hidden transition-colors duration-200"
            style={{ width: '100%' }}
          >
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto overflow-x-hidden">
              {/* Admin Dashboard if applicable */}
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  title={collapsed ? t('nav.adminDashboard', 'Admin Dashboard') : undefined}
                  className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/admin')
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <LayoutDashboard
                    size={18}
                    className={`shrink-0 ${location.pathname.startsWith('/admin') ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                  />
                  <span
                    style={{
                      opacity: collapsed ? 0 : 1,
                      maxWidth: collapsed ? '0px' : '200px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      transition: 'opacity 200ms ease, max-width 300ms cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    {t('nav.adminDashboard', 'Admin Dashboard')}
                  </span>
                </button>
              )}

              {/* Shipments Menu Group (Lô hàng với 2 submenu: Quản lý lô hàng & Tài chính lô hàng) */}
              <div>
                {collapsed ? (
                  // Collapsed View: Group icon that navigates to first child
                  <button
                    onClick={() => navigate('/shipments')}
                    title={t('nav.shipments', 'Lô hàng')}
                    className={`w-full flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isShipmentsActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Package
                      size={18}
                      className={`shrink-0 ${isShipmentsActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                    />
                  </button>
                ) : (
                  // Expanded View: Group header with Accordion
                  <div>
                    <button
                      onClick={() => setShipmentsOpen(!shipmentsOpen)}
                      className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        isShipmentsActive
                          ? 'text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Package
                          size={18}
                          className={`shrink-0 ${isShipmentsActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                        />
                        <span className="truncate">{t('nav.shipments', 'Lô hàng')}</span>
                      </div>
                      {shipmentsOpen ? (
                        <ChevronUp size={15} className="text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown size={15} className="text-slate-400 shrink-0" />
                      )}
                    </button>

                    {/* Child Submenu */}
                    {shipmentsOpen && (
                      <div className="mt-1 ml-4 pl-3 border-l-2 border-slate-100 dark:border-slate-800 space-y-1">
                        {shipmentsChildren.map((child) => {
                          const isChildActive = child.isActive(location.pathname);
                          return (
                            <button
                              key={child.path}
                              onClick={() => navigate(child.path)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                                isChildActive
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            >
                              <child.icon
                                size={15}
                                className={`shrink-0 ${isChildActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                              />
                              <span className="truncate">{child.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accounting Navigation Button */}
              <button
                onClick={() => navigate('/accounting')}
                title={collapsed ? t('nav.accounting', 'Accounting') : undefined}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/accounting')
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Calculator
                  size={18}
                  className={`shrink-0 ${location.pathname.startsWith('/accounting') ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                />
                <span
                  style={{
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? '0px' : '200px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 200ms ease, max-width 300ms cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {t('nav.accounting', 'Accounting')}
                </span>
              </button>

              {/* Master Data Menu Group */}
              <div className="pt-2">
                {collapsed ? (
                  // Collapsed View: Group icon that navigates to first child
                  <button
                    onClick={() => navigate('/master-data/customers')}
                    title={t('nav.masterData', 'Master Data')}
                    className={`w-full flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isMasterDataActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <Database
                      size={18}
                      className={`shrink-0 ${isMasterDataActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                    />
                  </button>
                ) : (
                  // Expanded View: Group header with Accordion
                  <div>
                    <button
                      onClick={() => setMasterDataOpen(!masterDataOpen)}
                      className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        isMasterDataActive
                          ? 'text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Database
                          size={18}
                          className={`shrink-0 ${isMasterDataActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                        />
                        <span className="truncate">{t('nav.masterData', 'Master Data')}</span>
                      </div>
                      {masterDataOpen ? (
                        <ChevronUp size={15} className="text-slate-400 shrink-0" />
                      ) : (
                        <ChevronDown size={15} className="text-slate-400 shrink-0" />
                      )}
                    </button>

                    {/* Child Submenu */}
                    {masterDataOpen && (
                      <div className="mt-1 ml-4 pl-3 border-l-2 border-slate-100 dark:border-slate-800 space-y-1">
                        {masterDataChildren.map((child) => {
                          const isChildActive = location.pathname === child.path;
                          return (
                            <button
                              key={child.path}
                              onClick={() => navigate(child.path)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                                isChildActive
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                              }`}
                            >
                              <child.icon
                                size={15}
                                className={`shrink-0 ${isChildActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                              />
                              <span className="truncate">{child.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </nav>

            <div className="px-3 pb-4 border-t border-slate-200 dark:border-slate-800 pt-4 overflow-hidden">
              <button
                onClick={() => navigate('/settings')}
                title={collapsed ? t('common.settings', 'Settings') : undefined}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/settings')
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Settings
                  size={18}
                  className={`shrink-0 ${
                    location.pathname.startsWith('/settings') ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                  }`}
                />
                <span
                  style={{
                    opacity: collapsed ? 0 : 1,
                    maxWidth: collapsed ? '0px' : '200px',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transition: 'opacity 200ms ease, max-width 300ms cubic-bezier(0.4,0,0.2,1)',
                  }}
                >
                  {t('common.settings', 'Settings')}
                </span>
              </button>
            </div>
          </aside>

          {/* Resize handle — sits on the right border, vertically centered */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              position: 'absolute',
              top: '50%',
              right: '-1px',
              transform: 'translateY(-50%)',
              zIndex: 30,
              width: hovering ? '20px' : '3px',
              height: hovering ? '32px' : '40px',
              borderRadius: '999px',
              background: hovering ? '#3b82f6' : (theme === 'dark' ? '#334155' : '#e2e8f0'),
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              transition: 'width 200ms ease, height 200ms ease, background 200ms ease',
              padding: 0,
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                opacity: hovering ? 1 : 0,
                transition: 'opacity 150ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </span>
          </button>
        </div>

        <main
          className="flex-1 overflow-y-auto relative transition-colors duration-200 bg-gradient-to-br from-slate-50 via-slate-100/50 to-blue-50/30 dark:from-[#090d18] dark:via-[#0b1325] dark:to-[#070b14]"
          style={{ borderLeft: theme === 'dark' ? '1px solid #1e293b' : '1px solid #e2e8f0' }}
        >
          {/* Subtle Ambient Radial Lighting Effects */}
          <div className="absolute top-0 right-1/4 w-[600px] h-[350px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 left-10 w-[500px] h-[400px] bg-indigo-500/5 dark:bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-10 w-[400px] h-[300px] bg-indigo-600/5 dark:bg-indigo-600/8 rounded-full blur-[100px] pointer-events-none" />
          
          {/* Subtle Dot Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.25] dark:opacity-[0.12] bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px]" />

          <div className="w-full mx-auto h-full flex flex-col relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
