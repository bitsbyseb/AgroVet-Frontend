import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { animalService, authService } from '../../services/api';
import type { Animal, ReproductionRecord, ReproductionInput } from '../../types';
import { ArrowLeft, Plus, Save, X, Activity, Heart } from 'lucide-react';

const AnimalReproduction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [reproduction, setReproduction] = useState<ReproductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ReproductionInput>({
    reproductiveStatus: 'pregnant',
    lastCalvingDate: '',
    offspringCount: 0,
    breedingType: 'natural'
  });

  // Only Zootechnician can add reproduction records
  const canAddReproduction = currentUser?.role === 'zootechnician';

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const animalData = await animalService.getById(id!);
      setAnimal(animalData);
      
      try {
        const reproductionData = await animalService.getReproduction(id!);
        setReproduction(reproductionData);
      } catch (err: unknown) {
        if ((err as { response?: { data?: { error?: string }, status?: number } }).response?.status === 403) {
          setForbidden(true);
        } else {
          throw err;
        }
      }
    } catch(err) {
      // eslint-disable-next-line no-unused-vars

      console.error('Error fetching reproduction:', err);
      setError('No se pudo cargar la información de reproducción.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    
    const submissionData: any = {
        ...formData,
        offspringCount: Number(formData.offspringCount)
    };
    if (formData.lastCalvingDate) {
      submissionData.lastCalvingDate = new Date(formData.lastCalvingDate).toISOString();
    } else {
      delete submissionData.lastCalvingDate;
    }

    setSaving(true);
    try {
      await animalService.addReproduction(id, submissionData);
      setShowAddForm(false);
      setFormData({
        reproductiveStatus: 'pregnant',
        lastCalvingDate: '',
        offspringCount: 0,
        breedingType: 'natural'
      });
      fetchData(); // Refresh list
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string }, status?: number } }).response?.data?.error || 'Error al guardar el registro de reproducción.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando datos de reproducción...</div>;

  if (forbidden) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error)' }}>Acceso Denegado</h2>
        <p>Tu rol actual no tiene permisos para ver los registros reproductivos.</p>
        <button onClick={() => navigate('/animals')} className="btn btn-primary" style={{ marginTop: '20px' }}>
          Volver a Animales
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-10" style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/animals')} 
          className="btn btn-sm" 
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft size={20} />
          Regresar
        </button>
      </div>

      <div className="flex justify-between items-start" style={{ marginBottom: '25px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
            Registro Reproductivo: <span style={{ color: 'var(--primary)' }}>{animal?.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {animal?.species} • {animal?.breed} • {animal?.gender === 'male' ? 'Macho' : 'Hembra'}
          </p>
        </div>
        
        {canAddReproduction && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary" style={{ backgroundColor: '#e91e63' }}>
            <Plus size={20} />
            Nuevo Evento
          </button>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="card" style={{ marginBottom: '30px', border: '1px solid #e91e63' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e91e63' }} className="flex items-center gap-10">
              <Heart size={20} />
              Agregar Nuevo Evento Reproductivo
            </h2>
            <button onClick={() => setShowAddForm(false)} className="btn btn-sm" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-20">
              <div className="form-group">
                <label>Estado Reproductivo</label>
                <select 
                  className="form-control"
                  value={formData.reproductiveStatus}
                  onChange={(e) => setFormData({...formData, reproductiveStatus: e.target.value})}
                  required
                >
                  <option value="pregnant">Preñada (Pregnant)</option>
                  <option value="open">Vacía (Open)</option>
                  <option value="lactating">Lactando (Lactating)</option>
                  <option value="dry">Seca (Dry)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tipo de Reproducción</label>
                <select 
                  className="form-control"
                  value={formData.breedingType}
                  onChange={(e) => setFormData({...formData, breedingType: e.target.value})}
                >
                  <option value="natural">Monta Natural</option>
                  <option value="artificial">Inseminación Artificial</option>
                  <option value="embryo_transfer">Transferencia de Embriones</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fecha de Último Parto (Opcional)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.lastCalvingDate}
                  onChange={(e) => setFormData({...formData, lastCalvingDate: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Número de Crías</label>
                <input 
                  type="number" 
                  min="0"
                  className="form-control" 
                  value={formData.offspringCount}
                  onChange={(e) => setFormData({...formData, offspringCount: Number(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div className="flex gap-10 justify-end" style={{ marginTop: '10px' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#e91e63' }} disabled={saving}>
                <Save size={20} />
                {saving ? 'Guardando...' : 'Guardar Evento'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-column gap-20">
        {reproduction.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <Activity size={48} style={{ color: '#cfd8dc', margin: '0 auto 15px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No hay eventos reproductivos registrados para este animal.</p>
          </div>
        ) : (
          reproduction.map((record) => (
            <div key={record.id} className="card" style={{ borderLeft: '4px solid #e91e63' }}>
              <div className="flex justify-between items-start" style={{ marginBottom: '15px' }}>
                <div className="flex items-center gap-10">
                  <div style={{ backgroundColor: '#fce4ec', color: '#e91e63', padding: '8px', borderRadius: '8px' }}>
                    <Heart size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem', textTransform: 'capitalize' }}>
                      Estado: {record.reproductiveStatus}
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Crías: {record.offspringCount} | Tipo: {record.breedingType || 'N/A'}
                    </p>
                    {record.lastCalvingDate && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Último Parto: {new Date(record.lastCalvingDate).toLocaleDateString('es-ES')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnimalReproduction;
