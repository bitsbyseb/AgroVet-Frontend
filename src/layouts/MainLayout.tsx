import React, { useEffect, useState, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { authService, alertService } from '../services/api';
import {
  LayoutDashboard,
  Users,
  Cat,
  LogOut,
  User as UserIcon,
  Calendar,
  Wheat,
  Layers,
  Compass,
  PawPrint,
  Bell,
  UserPlus,
  Languages,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const { t, i18n } = useTranslation();

  // Estados independientes de menú para Móvil (Drawer) y Escritorio (Colapsable)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  const currentLang = i18n.language?.startsWith('en') ? 'en' : 'es';

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const hasAlertsAccess = !!(user && ['veterinarian', 'zootechnician', 'administrator'].includes(user.role));
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Polling optimizado con detección de visibilidad de pestaña
  const fetchPending = useCallback(async () => {
    if (!hasAlertsAccess || document.visibilityState === 'hidden') return;
    try {
      const pending = await alertService.getPending();
      setPendingCount(pending.length);
    } catch {
      // Ignorar fallo silencioso
    }
  }, [hasAlertsAccess]);

  useEffect(() => {
    if (hasAlertsAccess) {
      fetchPending();
      const interval = setInterval(fetchPending, 30000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          fetchPending();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [hasAlertsAccess, fetchPending, location.pathname]);

  // Cerrar drawer móvil al cambiar de ruta
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Manejo de tecla Escape y bloqueo de scroll para drawer móvil
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileDrawerOpen) {
        setMobileDrawerOpen(false);
      }
    };

    if (mobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileDrawerOpen]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Alternar menú según tamaño de pantalla
  const handleToggleMenu = () => {
    if (window.innerWidth < 1024) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setDesktopCollapsed((prev) => !prev);
    }
  };

  const menuItems = [
    { name: t('nav.dashboard'), path: '/', icon: <LayoutDashboard size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: t('nav.alerts'), path: '/alerts', icon: <Bell size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: t('nav.myAnimals'), path: '/my-animals', icon: <PawPrint size={20} />, roles: ['owner'] },
    { name: t('nav.myReminders'), path: '/my-reminders', icon: <Bell size={20} />, roles: ['owner', 'administrator'] },
    { name: t('nav.animals'), path: '/animals', icon: <Cat size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: t('nav.paddocks'), path: '/paddocks', icon: <Layers size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: t('nav.grazing'), path: '/grazing', icon: <Compass size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: t('nav.appointments'), path: '/appointments', icon: <Calendar size={20} />, roles: ['veterinarian', 'administrator'] },
    { name: t('nav.foods'), path: '/foods', icon: <Wheat size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: t('nav.owners'), path: '/owners', icon: <Users size={20} />, roles: ['veterinarian', 'administrator'] },
    { name: t('nav.registerUser'), path: '/register', icon: <UserPlus size={20} />, roles: ['administrator'] },
  ];

  const visibleMenuItems = menuItems.filter((item) => !user || item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[var(--bg-color)] flex">
      {/* ─── 1. Drawer Móvil Desplegable (Pantallas < 1024px) ────────────────── */}
      <div className="lg:hidden">
        {/* Backdrop oscurecido */}
        <div
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 transition-opacity duration-300 ${
            mobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />

        {/* Panel Deslizante Lateral */}
        <aside
          id="mobile-sidebar"
          aria-label="Navegación móvil"
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#263238] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
            mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Cabecera Móvil */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#37474f]">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black tracking-tight text-white">AgroVet</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t('common.close')}
            >
              <X size={22} />
            </button>
          </div>

          {/* Navegación Móvil */}
          <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
            {visibleMenuItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl min-h-[44px] transition-all text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.name}</span>
                  </div>

                  {item.path === '/alerts' && pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-[11px] font-bold rounded-full px-2 py-0.5 shadow-xs">
                      {pendingCount > 99 ? '99+' : pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Perfil Móvil */}
          <div className="p-5 border-t border-[#37474f] space-y-3.5 bg-[#1e272c]">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-700/30 text-emerald-400 border border-emerald-600/40 flex items-center justify-center shrink-0 font-bold">
                <UserIcon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate leading-tight">{user?.username}</p>
                <p className="text-xs text-slate-400 capitalize truncate mt-0.5">
                  {user?.role ? t(`roles.${user.role}`) : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full min-h-[44px] px-4 py-2.5 bg-[#37474f] hover:bg-[#455a64] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-transparent hover:border-slate-500/50"
            >
              <LogOut size={16} />
              <span>{t('common.logout')}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ─── 2. Barra Lateral de Escritorio (Pantallas >= 1024px) ─────────────── */}
      <aside
        id="desktop-sidebar"
        aria-label="Navegación principal"
        className={`hidden lg:flex lg:flex-col lg:shrink-0 bg-[#263238] text-white border-r border-[#37474f] min-h-screen sticky top-0 h-screen transition-all duration-300 ease-in-out ${
          desktopCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Cabecera Desktop */}
        <div className={`flex items-center px-6 py-5 border-b border-[#37474f] ${desktopCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!desktopCollapsed && (
            <span className="text-2xl font-black tracking-tight text-white">AgroVet</span>
          )}
          <button
            type="button"
            onClick={() => setDesktopCollapsed(!desktopCollapsed)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title={desktopCollapsed ? t('common.menu') : t('common.close')}
            aria-label={desktopCollapsed ? t('common.menu') : t('common.close')}
          >
            {desktopCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Enlaces de Navegación Desktop */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

            return (
              <Link
                key={item.path}
                to={item.path}
                title={desktopCollapsed ? item.name : undefined}
                className={`flex items-center rounded-xl min-h-[44px] transition-all text-sm font-medium ${
                  desktopCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-4 py-3'
                } ${
                  isActive
                    ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${desktopCollapsed ? 'justify-center' : 'gap-3.5'}`}>
                  <span className="shrink-0">{item.icon}</span>
                  {!desktopCollapsed && <span className="truncate">{item.name}</span>}
                </div>

                {!desktopCollapsed && item.path === '/alerts' && pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-bold rounded-full px-2 py-0.5 shadow-xs">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}

                {desktopCollapsed && item.path === '/alerts' && pendingCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Perfil Desktop */}
        <div className={`p-4 border-t border-[#37474f] space-y-3 bg-[#1e272c] ${desktopCollapsed ? 'flex flex-col items-center' : ''}`}>
          {!desktopCollapsed ? (
            <>
              <div className="flex items-center gap-3 px-1">
                <div className="w-10 h-10 rounded-full bg-emerald-700/30 text-emerald-400 border border-emerald-600/40 flex items-center justify-center shrink-0 font-bold">
                  <UserIcon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate leading-tight">{user?.username}</p>
                  <p className="text-xs text-slate-400 capitalize truncate mt-0.5">
                    {user?.role ? t(`roles.${user.role}`) : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full min-h-[42px] px-3.5 py-2 bg-[#37474f] hover:bg-[#455a64] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-transparent hover:border-slate-500/50"
              >
                <LogOut size={16} />
                <span>{t('common.logout')}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 bg-[#37474f] hover:bg-red-700 text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center"
              title={t('common.logout')}
              aria-label={t('common.logout')}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      {/* ─── 3. Contenedor Principal (Header + Main) ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Barra Superior / Header con generoso espaciado */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 h-16 px-6 sm:px-8 flex items-center justify-between shadow-2xs">
          {/* Botón de apertura de menú (Móvil o Desktop) + Logotipo */}
          <div className="flex items-center gap-4 sm:gap-5">
            <button
              type="button"
              onClick={handleToggleMenu}
              className="p-2.5 text-gray-700 hover:text-emerald-700 hover:bg-gray-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
              aria-label={t('common.menu')}
              aria-expanded={mobileDrawerOpen || !desktopCollapsed}
            >
              <Menu size={22} />
            </button>
            <span className="font-extrabold text-gray-900 tracking-tight text-lg sm:text-xl">
              AgroVet
            </span>
          </div>

          {/* Acciones de Cabecera con separación holgada de elementos y bordes */}
          <div className="flex items-center gap-4 sm:gap-6 ml-auto">
            {/* Selector de idioma bilingüe estilizado */}
            <div className="flex items-center bg-gray-50 hover:bg-gray-100/90 p-1 rounded-full border border-gray-200 shadow-xs transition-all duration-200">
              <div className="pl-2.5 pr-1.5 text-emerald-800 flex items-center justify-center" aria-hidden="true">
                <Languages size={16} className="opacity-80" />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => changeLanguage('es')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                    currentLang === 'es'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold scale-[1.02]'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
                  }`}
                  title={t('common.spanish')}
                  aria-label={t('common.spanish')}
                >
                  <span>ES</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeLanguage('en')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1 ${
                    currentLang === 'en'
                      ? 'bg-emerald-700 text-white shadow-xs font-bold scale-[1.02]'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
                  }`}
                  title={t('common.english')}
                  aria-label={t('common.english')}
                >
                  <span>EN</span>
                </button>
              </div>
            </div>

            {/* Campana de Notificaciones con Badge accesible */}
            {hasAlertsAccess && (
              <Link
                to="/alerts"
                className="relative p-2.5 rounded-full text-gray-600 hover:text-emerald-700 hover:bg-gray-100 transition flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px]"
                title={t('common.systemAlerts')}
                aria-label={t('common.systemAlerts')}
              >
                <Bell size={22} />
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center shadow-xs">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </header>

        {/* ─── 4. Área de Contenido Principal (con separación holgada de los bordes) ─── */}
        <main className="flex-1 p-5 sm:p-8 lg:p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full space-y-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
