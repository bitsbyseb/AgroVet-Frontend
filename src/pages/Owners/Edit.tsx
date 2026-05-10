import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ownerService } from '../../services/api';
import type { OwnerUpdateInput } from '../../types';
import { ArrowLeft, Save } from 'lucide-react';

const EditOwner: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<OwnerUpdateInput>({
    name: '',
    phone: '',
    email: '',
    address: '',
    ownerType: 'urban'
  });
  const [document, setDocument] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOwner = async () => {
      if (!id) return;
      try {
        const owner = await ownerService.getById(id);
        setFormData({
          name: owner.name,
          phone: owner.phone,
          email: owner.email,
          address: owner.address,
          ownerType: owner.ownerType
        });
        setDocument(owner.document);
      } catch (err: unknown) {
        setError('Error al cargar datos del propietario.');
      } finally {
        setLoading(false);
      }
    };
    fetchOwner();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);

    try {
      await ownerService.update(id, formData);
      navigate('/owners');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Error al actualizar propietario.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;

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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '25px' }}>Editar Propietario</h1>
        
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
              <label>Documento / CC (No editable)</label>
              <input 
                type="text" 
                className="form-control" 
                value={document}
                disabled
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Teléfono</label>
              <input 
                type="text" 
                className="form-control" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                placeholder="Solo números"
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={saving}>
            <Save size={20} />
            {saving ? 'Guardando...' : 'Actualizar Propietario'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditOwner;
