import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { animalService, ownerService } from '../../services/api';
import type { Owner, Animal } from '../../types';
import { ArrowLeft, Send } from 'lucide-react';

const TransferAnimal: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [animalData, ownersData] = await Promise.all([
          animalService.getById(id),
          ownerService.list()
        ]);
        setAnimal(animalData);
        setOwners(ownersData.filter(o => o.id !== animalData.ownerId));
      } catch (err: unknown) {
        setError('Error al cargar datos.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newOwnerId) return;
    setSaving(true);
    setError(null);

    try {
      await animalService.transferOwner(id, newOwnerId);
      navigate('/animals');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Error al transferir animal.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;
  if (!animal) return <div style={{ padding: '20px' }}>Animal no encontrado.</div>;

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
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' }}>Transferir Animal</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '25px' }}>
          Transfiere a <strong>{animal.name}</strong> a un nuevo propietario.
        </p>
        
        {error && (
          <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nuevo Propietario</label>
            <select 
              className="form-control" 
              value={newOwnerId}
              onChange={(e) => setNewOwnerId(e.target.value)}
              required
            >
              <option value="">Seleccione un propietario</option>
              {owners.map(owner => (
                <option key={owner.id} value={owner.id}>{owner.name} ({owner.document})</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={saving || !newOwnerId}>
            <Send size={20} />
            {saving ? 'Transfiriendo...' : 'Confirmar Transferencia'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransferAnimal;
