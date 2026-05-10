import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { animalService, authService } from '../../services/api';
import type { Animal } from '../../types';
import { Plus, Cat, Edit2, RefreshCw, Trash2, Stethoscope, Syringe } from 'lucide-react';

const AnimalsList: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    setUser(authService.getCurrentUser());
    fetchAnimals();
  }, []);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const data = await animalService.list();
      setAnimals(data);
    } catch (err) {
      console.error('Error fetching animals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${name}? Esta acción no se puede deshacer.`)) {
      try {
        await animalService.delete(id);
        setAnimals(animals.filter(animal => animal.id !== id));
      } catch (err: unknown) {
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'Error al eliminar el animal.');
        setTimeout(() => setError(null), 5000);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Animales</h1>
          <p style={{ color: 'var(--text-muted)' }}>Lista de todos los animales registrados</p>
        </div>
        <Link to="/animals/new" className="btn btn-primary">
          <Plus size={20} />
          <span>Nuevo Registro</span>
        </Link>
      </div>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div className="card">
        {loading ? (
          <p>Cargando animales...</p>
        ) : animals.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No hay animales registrados.</p>
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
                  <th>Acciones</th>
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
                    <td>
                      <div className="flex gap-10">
                        <Link to={`/animals/${animal.id}/history`} className="btn btn-sm" title="Ver Historial Médico" style={{ color: 'var(--primary)' }}>
                          <Stethoscope size={16} />
                        </Link>
                        <Link to={`/animals/${animal.id}/vaccines`} className="btn btn-sm" title="Ver Vacunas" style={{ color: '#00acc1' }}>
                          <Syringe size={16} />
                        </Link>
                        <Link to={`/animals/${animal.id}/edit`} className="btn btn-sm" title="Editar">
                          <Edit2 size={16} />
                        </Link>
                        <Link to={`/animals/${animal.id}/transfer`} className="btn btn-sm" title="Transferir Dueño">
                          <RefreshCw size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(animal.id, animal.name)} 
                          className="btn btn-sm" 
                          style={{ color: 'var(--error)' }} 
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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

export default AnimalsList;
