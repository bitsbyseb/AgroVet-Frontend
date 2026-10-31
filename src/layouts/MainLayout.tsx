import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
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
  UserPlus
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const hasAlertsAccess = !!(user && ['veterinarian', 'zootechnician', 'administrator'].includes(user.role));
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (hasAlertsAccess) {
      const fetchPending = async () => {
        try {
          const pending = await alertService.getPending();
          setPendingCount(pending.length);
        } catch {
          // Ignorar fallo silencioso
        }
      };
      fetchPending();
      const interval = setInterval(fetchPending, 30000);
      return () => clearInterval(interval);
    }
  }, [hasAlertsAccess, location.pathname]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: 'Alertas', path: '/alerts', icon: <Bell size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: 'Mis Animales', path: '/my-animals', icon: <PawPrint size={20} />, roles: ['owner'] },
    { name: 'Recordatorios', path: '/my-reminders', icon: <Bell size={20} />, roles: ['owner', 'administrator'] },
    { name: 'Animales', path: '/animals', icon: <Cat size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: 'Potreros', path: '/paddocks', icon: <Layers size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: 'Pastoreo', path: '/grazing', icon: <Compass size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: 'Consultas', path: '/appointments', icon: <Calendar size={20} />, roles: ['veterinarian', 'administrator'] },
    { name: 'Alimentos', path: '/foods', icon: <Wheat size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: 'Propietarios', path: '/owners', icon: <Users size={20} />, roles: ['veterinarian', 'administrator'] },
    { name: 'Registrar Usuario', path: '/register', icon: <UserPlus size={20} />, roles: ['administrator'] },
  ];

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-w)',
        backgroundColor: '#263238',
        color: 'white',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ padding: '0 20px 30px', borderBottom: '1px solid #37474f', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>AgroVet</h2>
        </div>
        
        <nav style={{ flex: 1 }}>
          {menuItems
            .filter(item => !user || item.roles.includes(user.role))
            .map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className="flex items-center justify-between"
                style={{
                  padding: '12px 20px',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: 'white',
                  transition: 'background 0.2s',
                  fontWeight: isActive ? 600 : 400
                }}
              >
                <div className="flex items-center" style={{ gap: '12px' }}>
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.path === '/alerts' && pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-[11px] font-bold rounded-full px-2 py-0.5">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '20px', borderTop: '1px solid #37474f' }}>
          <div className="flex items-center gap-10" style={{ marginBottom: '15px' }}>
            <UserIcon size={20} />
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.username}</p>
              <p style={{ fontSize: '0.8rem', color: '#b0bec5' }}>
                {user?.role === 'administrator' ? 'Administrador' : user?.role === 'zootechnician' ? 'Zootecnista' : user?.role === 'owner' ? 'Propietario' : 'Veterinario'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="btn"
            style={{ width: '100%', backgroundColor: '#455a64', color: 'white', justifyContent: 'flex-start', padding: '10px' }}
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, backgroundColor: 'var(--bg-color)', overflowY: 'auto' }}>
        <header style={{ 
          backgroundColor: 'white', 
          padding: '12px 30px', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '16px'
        }}>
          {hasAlertsAccess && (
            <Link
              to="/alerts"
              className="relative p-2 rounded-full text-gray-600 hover:text-emerald-700 hover:bg-gray-100 transition flex items-center justify-center cursor-pointer"
              title="Alertas del Sistema"
            >
              <Bell size={22} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center shadow-xs">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </Link>
          )}
        </header>
        <div style={{ padding: '30px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
