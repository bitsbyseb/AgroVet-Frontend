import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ownerService } from '../../services/api';
import type { OwnerInput } from '../../types';
import { ArrowLeft, Save } from 'lucide-react';

const CreateOwner: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<OwnerInput>({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    ownerType: 'urban'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await ownerService.create(formData);
      navigate('/owners');
    } catch (err: unknown) {
      const axiosError = err as any;
      setError(axiosError.response?.data?.error || 'Error al registrar propietario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <button 
        onClick={() => navigate('/owners')} 
        className="btn" 
        style={{ marginBottom: '20px', color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={20} />
        Regresar
      </button>

      <div className="card">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px' }}>Registrar Nuevo Propietario</h1>
        
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="flex gap-10">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Documento / CC</label>
              <input 
                type="number" 
                className="form-control" 
                value={formData.document}
                onChange={(e) => setFormData({...formData, document: e.target.value})}
                required
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Teléfono</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              className="form-control" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Dirección</label>
            <input 
              type="text" 
              className="form-control" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de Propietario</label>
            <select 
              className="form-control" 
              value={formData.ownerType}
              onChange={(e) => setFormData({...formData, ownerType: e.target.value})}
              required
            >
              <option value="urban">Urbano</option>
              <option value="rural">Rural</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
            <Save size={20} />
            {loading ? 'Guardando...' : 'Guardar Propietario'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateOwner;
