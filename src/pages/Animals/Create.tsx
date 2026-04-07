import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { animalService, ownerService } from '../../services/api';
import type { Owner } from '../../types';
import { ArrowLeft, Save } from 'lucide-react';

const CreateAnimal: React.FC = () => {
  const navigate = useNavigate();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    birthDate: '',
    ownerId: ''
  });
  const [loading, setLoading] = useState(false);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const data = await ownerService.list();
        setOwners(data);
      } catch (err) {
        console.error('Error fetching owners:', err);
      } finally {
        setOwnersLoading(false);
      }
    };
    fetchOwners();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ownerId) {
      setError('Debes seleccionar un propietario.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await animalService.create(formData);
      navigate('/animals');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al registrar animal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/animals')} 
        className="btn" 
        style={{ marginBottom: '20px', color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={20} />
        Regresar
      </button>

      <div className="card">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px' }}>Registrar Nuevo Animal</h1>
        
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Animal</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ej: Bessie"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="flex gap-10">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Especie</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej: Bovino"
                value={formData.species}
                onChange={(e) => setFormData({...formData, species: e.target.value})}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Raza</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej: Holstein"
                value={formData.breed}
                onChange={(e) => setFormData({...formData, breed: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Fecha de Nacimiento</label>
            <input 
              type="date" 
              className="form-control" 
              value={formData.birthDate}
              onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Propietario</label>
            <select 
              className="form-control" 
              value={formData.ownerId}
              onChange={(e) => setFormData({...formData, ownerId: e.target.value})}
              required
              disabled={ownersLoading}
            >
              <option value="">{ownersLoading ? 'Cargando propietarios...' : 'Seleccione un propietario'}</option>
              {owners.map(owner => (
                <option key={owner.id} value={owner.id}>{owner.name} ({owner.document})</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            <Save size={20} />
            {loading ? 'Guardando...' : 'Guardar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAnimal;
