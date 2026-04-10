import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { authService } from '../services/api';
import { LayoutDashboard, Users, Cat, LogOut, User as UserIcon } from 'lucide-react';

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: 'Animales', path: '/animals', icon: <Cat size={20} />, roles: ['veterinarian', 'zootechnician', 'administrator'] },
    { name: 'Propietarios', path: '/owners', icon: <Users size={20} />, roles: ['veterinarian', 'administrator'] },
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
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className="flex items-center"
                style={{
                  padding: '12px 20px',
                  gap: '12px',
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: 'white',
                  transition: 'background 0.2s'
                }}
              >
                {item.icon}
                <span>{item.name}</span>
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
                {user?.role === 'administrator' ? 'Administrador' : user?.role === 'zootechnician' ? 'Zootecnista' : 'Veterinario'}
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
          padding: '15px 30px', 
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
           {/* Add notification or user profile link here if needed */}
        </header>
        <div style={{ padding: '30px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
