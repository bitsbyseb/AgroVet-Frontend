import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { animalService } from '../../services/api';
import type { Animal } from '../../types';
import { Plus, Cat } from 'lucide-react';

const AnimalsList: React.FC = () => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const data = await animalService.list();
        setAnimals(data);
      } catch (err) {
        console.error('Error fetching animals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnimals();
  }, []);

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
                  <th>Propietario ID</th>
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
                    <td>{new Date(animal.birthDate).toLocaleDateString()}</td>
                    <td>
                       <code style={{ fontSize: '0.8rem', backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '4px' }}>
                         {animal.ownerId}
                       </code>
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
