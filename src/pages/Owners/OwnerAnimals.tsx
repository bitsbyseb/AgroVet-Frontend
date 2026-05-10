import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ownerService } from '../../services/api';
import type { Animal, Owner } from '../../types';
import { ArrowLeft, Cat } from 'lucide-react';

const OwnerAnimals: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [ownerData, animalsData] = await Promise.all([
          ownerService.getById(id),
          ownerService.getAnimals(id)
        ]);
        setOwner(ownerData);
        setAnimals(animalsData);
      } catch (err: unknown) {
        setError('Error al cargar datos del propietario y sus animales.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;
  if (!owner) return <div style={{ padding: '20px' }}>Propietario no encontrado.</div>;

  return (
    <div>
      <button 
        onClick={() => navigate('/owners')} 
        className="btn" 
        style={{ marginBottom: '20px', color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={20} />
        Regresar a Propietarios
      </button>

      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Animales de {owner.name}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Documento: {owner.document}</p>
      </div>

      <div className="card">
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {animals.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Este propietario no tiene animales registrados.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Especie</th>
                  <th>Raza</th>
                  <th>Fecha Nac.</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {animals.map((animal) => (
                  <tr key={animal.id}>
                    <td className="flex items-center gap-10">
                      <div style={{ backgroundColor: '#fff3e0', color: '#ef6c00', padding: '8px', borderRadius: '50%' }}>
                        <Cat size={16} />
                      </div>
                      <span style={{ fontWeight: '500' }}>{animal.name}</span>
                    </td>
                    <td>{animal.species}</td>
                    <td>{animal.breed}</td>
                    <td>{animal.birthDate ? new Date(animal.birthDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                       <span style={{ 
                         padding: '4px 8px', 
                         borderRadius: '12px', 
                         fontSize: '0.8rem',
                         backgroundColor: animal.status === 'inactive' ? '#ffebee' : '#e8f5e9',
                         color: animal.status === 'inactive' ? 'var(--error)' : 'var(--primary)'
                       }}>
                         {animal.status === 'inactive' ? 'Inactivo' : 'Activo'}
                       </span>
                    </td>
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

export default OwnerAnimals;
