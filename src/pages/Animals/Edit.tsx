import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { animalService } from '../../services/api';
import type { AnimalUpdateInput } from '../../types';
import { ArrowLeft, Save } from 'lucide-react';

const EditAnimal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AnimalUpdateInput>({
    name: '',
    color: '',
    breed: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnimal = async () => {
      if (!id) return;
      try {
        const animal = await animalService.getById(id);
        setFormData({
          name: animal.name,
          color: animal.color,
          breed: animal.breed,
          status: animal.status || 'active'
        });
      } catch (err: unknown) {
        setError('Error al cargar datos del animal.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnimal();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);

    try {
      await animalService.update(id, formData);
      navigate('/animals');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Error al actualizar animal.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px' }}>Editar Animal</h1>
        
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
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Raza</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.breed}
              onChange={(e) => setFormData({...formData, breed: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Color</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.color}
              onChange={(e) => setFormData({...formData, color: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select 
              className="form-control" 
              value={formData.status || 'active'}
              onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'inactive'})}
              required
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={saving}>
            <Save size={20} />
            {saving ? 'Guardando...' : 'Actualizar Registro'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditAnimal;
