import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { animalService, authService } from '../../services/api';
import type { Animal, MedicalHistoryRecord, MedicalHistoryInput } from '../../types';
import { ArrowLeft, Plus, Stethoscope, Save, X, Calendar, User as UserIcon, FileText } from 'lucide-react';

const AnimalHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [history, setHistory] = useState<MedicalHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<MedicalHistoryInput>({
    date: new Date().toISOString().split('T')[0],
    reason: '',
    diagnosis: '',
    treatment: '',
    observations: ''
  });

  const canAddHistory = currentUser?.role === 'veterinarian';

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [animalData, historyData] = await Promise.all([
        animalService.getById(id!),
        animalService.getHistory(id!)
      ]);
      setAnimal(animalData);
      setHistory(historyData);
    } catch(err) {
      // eslint-disable-next-line no-unused-vars

      console.error('Error fetching history:', err);
      setError('No se pudo cargar la información del animal o su historial.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    
    // Format date to full ISO string
    const submissionData = {
        ...formData,
        date: new Date(formData.date).toISOString()
    };

    setSaving(true);
    try {
      await animalService.addHistory(id, submissionData);
      setShowAddForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        reason: '',
        diagnosis: '',
        treatment: '',
        observations: ''
      });
      fetchData(); // Refresh history
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string }, status?: number } }).response?.data?.error || 'Error al guardar el registro médico.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando historial médico...</div>;

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
            Historial Médico: <span style={{ color: 'var(--primary)' }}>{animal?.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {animal?.species} • {animal?.breed} • {animal?.gender === 'male' ? 'Macho' : 'Hembra'}
          </p>
        </div>
        
        {canAddHistory && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            <Plus size={20} />
            Nuevo Registro
          </button>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="card" style={{ marginBottom: '30px', border: '1px solid var(--primary)' }}>
          <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }} className="flex items-center gap-10">
              <Stethoscope size={20} />
              Agregar Nuevo Registro Médico
            </h2>
            <button onClick={() => setShowAddForm(false)} className="btn btn-sm" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-20">
              <div className="form-group">
                <label>Fecha de la Consulta</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Motivo de Consulta</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: Control de peso, Herida en pata..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Diagnóstico</label>
              <textarea 
                className="form-control" 
                rows={2}
                placeholder="Descripción del diagnóstico..."
                value={formData.diagnosis}
                onChange={(e) => setFormData({...formData, diagnosis: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Tratamiento</label>
              <textarea 
                className="form-control" 
                rows={2}
                placeholder="Medicamentos, dosis, duración..."
                value={formData.treatment}
                onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Observaciones Adicionales (Opcional)</label>
              <textarea 
                className="form-control" 
                rows={2}
                placeholder="Otras notas relevantes..."
                value={formData.observations}
                onChange={(e) => setFormData({...formData, observations: e.target.value})}
              />
            </div>

            <div className="flex gap-10 justify-end" style={{ marginTop: '10px' }}>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn">
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={20} />
                {saving ? 'Guardando...' : 'Guardar Registro'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-column gap-20">
        {history.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <FileText size={48} style={{ color: '#cfd8dc', margin: '0 auto 15px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No hay registros médicos para este animal.</p>
          </div>
        ) : (
          history.map((record) => (
            <div key={record.id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="flex justify-between items-start" style={{ marginBottom: '15px' }}>
                <div className="flex items-center gap-10">
                  <div style={{ backgroundColor: '#e3f2fd', color: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{record.reason}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(record.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                {record.professional && (
                  <div className="flex items-center gap-5" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '15px' }}>
                    <UserIcon size={14} />
                    <span>{record.professional.username} ({record.professional.role})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-20" style={{ marginTop: '15px' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#546e7a', marginBottom: '5px' }}>Diagnóstico</h4>
                  <p style={{ fontSize: '0.95rem' }}>{record.diagnosis}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#546e7a', marginBottom: '5px' }}>Tratamiento</h4>
                  <p style={{ fontSize: '0.95rem' }}>{record.treatment}</p>
                </div>
              </div>

              {record.observations && (
                <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#546e7a', marginBottom: '5px' }}>Observaciones</h4>
                  <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: '#455a64' }}>{record.observations}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnimalHistory;
