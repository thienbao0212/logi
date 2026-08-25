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
  Anchor
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
  const isAdmin = memberships.some((m: any) => m.role === 'admin');
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  
  // Master data submenu toggle state
  const isMasterDataActive = location.pathname.startsWith('/master-data');
  const [masterDataOpen, setMasterDataOpen] = useState(true);

  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (isMasterDataActive) {
      setMasterDataOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('memberships');
    navigate('/login');
  };

  const navItems = [
    ...(isAdmin ? [{ name: t('nav.adminDashboard', 'Admin Dashboard'), path: '/admin', icon: LayoutDashboard }] : []),
    { name: t('nav.shipments', 'Shipments'), path: '/shipments', icon: Package },
    { name: t('nav.accounting', 'Accounting'), path: '/accounting', icon: Calculator },
  ];

  const masterDataChildren = [
    { name: t('nav.customers', 'Quản lý khách hàng'), path: '/master-data/customers', icon: Users },
    { name: t('nav.shippingLines', 'Quản lý hãng tàu'), path: '/master-data/shipping-lines', icon: Ship },
    { name: t('nav.ports', 'Quản lý cảng'), path: '/master-data/ports', icon: Anchor },
  ];

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 relative shadow-sm">
        <div 
          className="flex items-center gap-3 shrink-0"
          style={{
            width: collapsed ? '40px' : '232px',
            transition: 'width 300ms cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
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
            className="font-bold text-slate-900 tracking-tight text-lg"
          >
            LogiFlow
          </span>
        </div>

        {/* Dynamic header content injected from pages via Portal */}
        <div id="app-header-extra" className="flex-1 flex justify-start items-center pl-6 pr-4 overflow-hidden min-w-0" />

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={() => i18n.changeLanguage(i18n.language === 'vi' ? 'en' : 'vi')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-100"
            title="Switch Language"
          >
            <Globe size={20} />
            <span className="text-sm font-semibold uppercase">{i18n.language === 'vi' ? 'EN' : 'VI'}</span>
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
            <User size={16} className="text-slate-500" />
            <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-900 transition-colors p-2 rounded-full hover:bg-slate-100"
            title="Log out"
          >
            <LogOut size={20} />
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
          <aside className="bg-white h-full flex flex-col overflow-hidden"
            style={{ width: '100%' }}
          >
            <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto overflow-x-hidden">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    title={collapsed ? item.name : undefined}
                    className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon
                      size={18}
                      className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`}
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
                      {item.name}
                    </span>
                  </button>
                );
              })}

              {/* Master Data Menu Group */}
              <div className="pt-2">
                {collapsed ? (
                  // Collapsed View: Group icon that navigates to first child
                  <button
                    onClick={() => navigate('/master-data/customers')}
                    title={t('nav.masterData', 'Master Data')}
                    className={`w-full flex items-center justify-center p-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isMasterDataActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Database
                      size={18}
                      className={`shrink-0 ${isMasterDataActive ? 'text-blue-600' : 'text-slate-400'}`}
                    />
                  </button>
                ) : (
                  // Expanded View: Group header with Accordion
                  <div>
                    <button
                      onClick={() => setMasterDataOpen(!masterDataOpen)}
                      className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        isMasterDataActive
                          ? 'text-blue-700 bg-blue-50/50'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Database
                          size={18}
                          className={`shrink-0 ${isMasterDataActive ? 'text-blue-600' : 'text-slate-400'}`}
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
                      <div className="mt-1 ml-4 pl-3 border-l-2 border-slate-100 space-y-1">
                        {masterDataChildren.map((child) => {
                          const isChildActive = location.pathname === child.path;
                          return (
                            <button
                              key={child.path}
                              onClick={() => navigate(child.path)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                                isChildActive
                                  ? 'bg-blue-50 text-blue-700 font-semibold'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                            >
                              <child.icon
                                size={15}
                                className={`shrink-0 ${isChildActive ? 'text-blue-600' : 'text-slate-400'}`}
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

            <div className="px-3 pb-4 border-t border-slate-200 pt-4 overflow-hidden">
              <button
                onClick={() => navigate('/settings')}
                title={collapsed ? t('common.settings', 'Settings') : undefined}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/settings')
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Settings
                  size={18}
                  className={`shrink-0 ${
                    location.pathname.startsWith('/settings') ? 'text-blue-600' : 'text-slate-400'
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
              background: hovering ? '#3b82f6' : '#e2e8f0',
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
          className="flex-1 overflow-y-auto relative"
          style={{ borderLeft: '1px solid #e2e8f0' }}
        >
          <div className="w-full mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
