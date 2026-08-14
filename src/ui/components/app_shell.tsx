import { apiFetch } from '@/lib/fetch.js';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, LogOut, LayoutDashboard, Settings, User, ChevronLeft, ChevronRight, Globe, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const memberships = JSON.parse(localStorage.getItem('memberships') || '[]');
  const isAdmin = memberships.some((m: any) => m.role === 'admin');
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const { t, i18n } = useTranslation();

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

  const allNavItems = [
    { name: t('nav.adminDashboard', 'Admin Dashboard'), path: '/admin', icon: LayoutDashboard, adminOnly: true },
    { name: t('nav.shipments', 'Shipments'), path: '/shipments', icon: Package, adminOnly: false },
    { name: t('nav.accounting', 'Accounting'), path: '/accounting', icon: Calculator, adminOnly: false },
  ];

  // Admin thấy tất cả các menu, user thường chỉ thấy menu không phải adminOnly
  const navItems = isAdmin
    ? allNavItems
    : allNavItems.filter((item) => !item.adminOnly);

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 relative shadow-sm">
        <div 
          className="flex items-center gap-3 shrink-0"
          style={{
            width: collapsed ? '40px' : '232px', // 64px - 24px padding = 40px, 256px - 24px padding = 232px
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
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-hidden">
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
            </nav>

            <div className="px-3 pb-4 border-t border-slate-200 pt-4 overflow-hidden">
              <button
                title={collapsed ? 'Settings' : undefined}
                className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Settings size={18} className="text-slate-400 shrink-0" />
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
              // The handle itself: thin vertical pill
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
