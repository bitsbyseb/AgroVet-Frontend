import React from 'react';
import { authService } from '../../services/api';
import { Beef, Users, Cat, Activity } from 'lucide-react';

const Dashboard: React.FC = () => {
  const user = authService.getCurrentUser();

  const stats = [
    { name: 'Total Animales', value: '45', icon: <Cat size={24} />, color: '#4caf50' },
    { name: 'Propietarios', value: '12', icon: <Users size={24} />, color: '#2196f3' },
    { name: 'Consultas Hoy', value: '8', icon: <Activity size={24} />, color: '#ff9800' },
    { name: 'Alertas', value: '2', icon: <Beef size={24} />, color: '#f44336' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Bienvenido, {user?.username}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Panel de control general de AgroVet</p>
      </div>

      <div className="flex gap-10" style={{ flexWrap: 'wrap' }}>
        {stats.map((stat, idx) => (
          <div key={idx} className="card" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ backgroundColor: stat.color + '22', color: stat.color, padding: '15px', borderRadius: '12px' }}>
              {stat.icon}
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{stat.name}</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20">
        <div className="card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '20px' }}>Actividad Reciente</h2>
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
            No hay actividad reciente para mostrar.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
