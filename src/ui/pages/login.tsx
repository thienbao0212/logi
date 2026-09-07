import { apiFetch } from '@/lib/fetch.js';
import React, { useState } from 'react';
import { 
  Package, 
  Lock, 
  Mail, 
  Loader2, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Globe,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const json = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Store token and user data
      localStorage.setItem('token', json.data.token);
      localStorage.setItem('user', JSON.stringify(json.data.user));
      localStorage.setItem('memberships', JSON.stringify(json.data.memberships));

      // Route based on role
      const isAdmin = json.data.memberships?.some((m: any) => m.role === 'admin');
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/shipments');
      }
    } catch (err: any) {
      setError(err.message || t('login.failed', 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
  };

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0f1d] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* ── Subtle Background Logistics Ambient Lighting ─────────────────── */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[450px] h-[450px] bg-cyan-600/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Subtle Coordinate Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px]" 
      />

      {/* Modern Maritime & Air Freight Vector Routes SVG */}
      <svg 
        className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Global transit flight & maritime arcs */}
        <path 
          d="M -100 260 Q 260 90 620 290 T 1320 190" 
          fill="none" 
          stroke="url(#routeGrad)" 
          strokeWidth="1.2" 
          strokeDasharray="5 6" 
        />
        <path 
          d="M 60 720 Q 460 470 920 640 T 1620 500" 
          fill="none" 
          stroke="#38bdf8" 
          strokeWidth="1" 
          strokeDasharray="4 6" 
          strokeOpacity="0.35"
        />
        <path 
          d="M 210 110 Q 720 360 1220 230" 
          fill="none" 
          stroke="#818cf8" 
          strokeWidth="1" 
          strokeDasharray="3 5" 
          strokeOpacity="0.25"
        />

        {/* Pulsing Port Hub Nodes */}
        <circle cx="260" cy="190" r="3.5" fill="#38bdf8" className="animate-pulse" />
        <circle cx="620" cy="290" r="3.5" fill="#60a5fa" className="animate-pulse" />
        <circle cx="920" cy="640" r="3.5" fill="#34d399" className="animate-pulse" />
      </svg>

      {/* ── Main Container: Refined Split Card ─────────────────────────── */}
      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/85 backdrop-blur-2xl border border-slate-800/80 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.7),0_0_50px_rgba(30,58,138,0.12)] overflow-hidden">
        
        {/* ── Left Column: Logistics Brand & Visual Showcase ── */}
        <div className="hidden lg:flex lg:col-span-6 flex-col justify-between p-8 xl:p-9 border-r border-slate-800/70 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/30 relative">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Package size={20} strokeWidth={2.2} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white tracking-tight">LogiFlow</span>
              <span className="text-[10px] font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded-full">
                TMS
              </span>
            </div>
          </div>

          {/* Logistics 3D Visual Card */}
          <div className="my-auto py-5 space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-black/60 group">
              <img 
                src="/logistics_hero.jpg" 
                alt="Logistics & Supply Chain" 
                className="w-full h-44 xl:h-52 object-cover object-center transform group-hover:scale-[1.03] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-mono text-cyan-300 text-[11px]">Global Supply Chain Network</span>
                <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-medium bg-slate-950/60 backdrop-blur-sm px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Fleet
                </span>
              </div>
            </div>

            {/* Headline & Subtitle */}
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-white leading-snug tracking-tight">
                Quản trị Vận tải & Logistics Toàn diện
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nền tảng kết nối vận hành lô hàng, tối ưu hóa tuyến vận tải và kiểm soát chi phí thời gian thực.
              </p>
            </div>
          </div>

          {/* Left Footer Trust Badge */}
          <div className="text-xs text-slate-400 flex items-center gap-2 pt-3 border-t border-slate-800/50">
            <ShieldCheck size={14} className="text-cyan-400" />
            <span>Bảo mật dữ liệu chuẩn doanh nghiệp SSL 256-bit</span>
          </div>
        </div>

        {/* ── Right Column: Refined Dark Login Form ───────────────────── */}
        <div className="lg:col-span-6 p-7 sm:p-9 flex flex-col justify-between bg-slate-900/95 relative">
          
          {/* Header & Language Switcher */}
          <div className="flex items-center justify-between pb-5">
            <div>
              {/* Mobile Logo */}
              <div className="flex lg:hidden items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Package size={16} />
                </div>
                <span className="text-base font-bold text-white tracking-tight">LogiFlow</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {t('login.title', 'Đăng nhập')}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('login.subtitle', 'Đăng nhập để quản lý lô hàng')}
              </p>
            </div>

            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
              title="Chuyển đổi ngôn ngữ / Switch language"
            >
              <Globe size={13} className="text-cyan-400" />
              <span>{i18n.language === 'vi' ? 'Tiếng Việt' : 'English'}</span>
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">
                {t('login.email_label', 'Địa chỉ Email')}
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@logiflow.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 hover:border-slate-600 focus:border-blue-500 focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-100 placeholder:text-slate-500 font-medium outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-300">
                  {t('login.password_label', 'Mật khẩu')}
                </label>
                <a 
                  href="#forgot" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    alert('Vui lòng liên hệ Quản trị viên hệ thống để khôi phục mật khẩu.'); 
                  }}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 hover:border-slate-600 focus:border-blue-500 focus:bg-slate-950 focus:ring-2 focus:ring-blue-500/20 text-xs text-slate-100 placeholder:text-slate-500 font-medium outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="pt-0.5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-950 h-3.5 w-3.5 cursor-pointer"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-500/40 shadow-md shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>{t('login.signing_in', 'Đang đăng nhập...')}</span>
                </>
              ) : (
                <>
                  <span>{t('login.sign_in', 'Đăng nhập')}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill - Subtle Dark Pills */}
          <div className="mt-5 pt-4 border-t border-slate-800/70 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Sparkles size={12} className="text-amber-400" />
              Tài khoản mẫu:
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@logiflow.com')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border border-slate-700/60 text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('logistic@logiflow.com')}
                className="px-2.5 py-1 rounded-lg bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border border-slate-700/60 text-[11px] font-medium transition-all active:scale-95 cursor-pointer"
              >
                Điều hành
              </button>
            </div>
          </div>

          {/* Footer Copyright */}
          <div className="mt-3 text-center text-[10px] text-slate-500">
            © 2026 LogiFlow
          </div>
        </div>

      </div>
    </div>
  );
}

