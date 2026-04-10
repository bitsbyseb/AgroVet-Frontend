import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ownerService, authService } from '../../services/api';
import type { Owner } from '../../types';
import { Plus, User as UserIcon } from 'lucide-react';

const OwnersList: React.FC = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const user = authService.getCurrentUser();
  const isAdmin = user?.role === 'administrator';

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const data = await ownerService.list();
        setOwners(data);
      } catch (err) {
        console.error('Error fetching owners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Propietarios</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestiona los dueños de los animales</p>
        </div>
        {isAdmin && (
          <Link to="/owners/new" className="btn btn-primary">
            <Plus size={20} />
            <span>Nuevo Propietario</span>
          </Link>
        )}
      </div>

      <div className="card">
        {loading ? (
          <p>Cargando propietarios...</p>
        ) : owners.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay propietarios registrados.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Tipo</th>
                  <th>Dirección</th>
                </tr>
              </thead>
              <tbody>
                {owners.map((owner) => (
                  <tr key={owner.id}>
                    <td className="flex items-center gap-10">
                      <div style={{ backgroundColor: '#e8f5e9', color: 'var(--primary)', padding: '8px', borderRadius: '50%' }}>
                        <UserIcon size={16} />
                      </div>
                      <span style={{ fontWeight: '500' }}>{owner.name}</span>
                    </td>
                    <td>{owner.document}</td>
                    <td>{owner.email}</td>
                    <td>{owner.phone}</td>
                    <td>
                       <span style={{ 
                         padding: '4px 8px', 
                         borderRadius: '12px', 
                         fontSize: '0.8rem',
                         backgroundColor: owner.ownerType === 'rural' ? '#fff3e0' : '#e3f2fd',
                         color: owner.ownerType === 'rural' ? '#e65100' : '#1565c0'
                       }}>
                         {owner.ownerType === 'rural' ? 'Rural' : 'Urbano'}
                       </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{owner.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnersList;
