import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { animalService, authService } from '../../services/api';
import type { Animal, VaccineRecord, VaccineInput } from '../../types';
import { ArrowLeft, Plus, Syringe, Save, X, Calendar, User as UserIcon, FileText } from 'lucide-react';

const AnimalVaccines: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    vaccineName: '',
    applicationDate: new Date().toISOString().split('T')[0],
    nextDoseDate: '',
    batchNumber: ''
  });

  // Según RBAC: Vacunas -> Veterinario (Full Access), Zootecnista (Solo Lectura), Admin (Solo Lectura)
  const canAddVaccine = currentUser?.role === 'veterinarian';

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [animalData, vaccinesData] = await Promise.all([
        animalService.getById(id!),
        animalService.getVaccines(id!)
      ]);
      setAnimal(animalData);
      setVaccines(vaccinesData);
    } catch (err) {
      console.error('Error fetching vaccines:', err);
      setError('No se pudo cargar la información del animal o sus vacunas.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    
    // Format dates to ISO as required by guide
    const submissionData: VaccineInput = {
      vaccineName: formData.vaccineName,
      applicationDate: new Date(formData.applicationDate).toISOString(),
      batchNumber: formData.batchNumber || undefined,
      nextDoseDate: formData.nextDoseDate ? new Date(formData.nextDoseDate).toISOString() : undefined
    };

    setSaving(true);
    try {
      await animalService.addVaccine(id, submissionData);
      setShowAddForm(false);
      setFormData({
        vaccineName: '',
        applicationDate: new Date().toISOString().split('T')[0],
        nextDoseDate: '',
        batchNumber: ''
      });
      fetchData(); // Refresh history
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar la vacuna.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando vacunas...</div>;

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
            Registro de Vacunas: <span style={{ color: 'var(--primary)' }}>{animal?.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {animal?.species} • {animal?.breed} • {animal?.gender === 'male' ? 'Macho' : 'Hembra'}
          </p>
        </div>
        
        {canAddVaccine && !showAddForm && (
          <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
            <Plus size={20} />
            Nueva Vacuna
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
              <Syringe size={20} />
              Registrar Nueva Vacuna
            </h2>
            <button onClick={() => setShowAddForm(false)} className="btn btn-sm" style={{ color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nombre de la Vacuna</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej: Antirrábica, Parvovirus..."
                value={formData.vaccineName}
                onChange={(e) => setFormData({...formData, vaccineName: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-20" style={{ marginTop: '15px' }}>
              <div className="form-group">
                <label>Fecha de Aplicación</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.applicationDate}
                  onChange={(e) => setFormData({...formData, applicationDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Próxima Dosis (Opcional)</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.nextDoseDate}
                  onChange={(e) => setFormData({...formData, nextDoseDate: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Número de Lote (Opcional)</label>
              <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej: LOTE-12345"
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
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
        {vaccines.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <FileText size={48} style={{ color: '#cfd8dc', margin: '0 auto 15px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No hay vacunas registradas para este animal.</p>
          </div>
        ) : (
          vaccines.map((record) => (
            <div key={record.id} className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <div className="flex justify-between items-start" style={{ marginBottom: '15px' }}>
                <div className="flex items-center gap-10">
                  <div style={{ backgroundColor: '#e3f2fd', color: 'var(--primary)', padding: '8px', borderRadius: '8px' }}>
                    <Syringe size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{record.vaccineName}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Aplicada: {new Date(record.applicationDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                {record.administeredBy && (
                  <div className="flex items-center gap-5" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', backgroundColor: '#f5f5f5', padding: '4px 10px', borderRadius: '15px' }}>
                    <UserIcon size={14} />
                    <span>{record.administeredBy.username} ({record.administeredBy.role})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-20" style={{ marginTop: '15px' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#546e7a', marginBottom: '5px' }}>Lote</h4>
                  <p style={{ fontSize: '0.95rem' }}>{record.batchNumber || 'N/A'}</p>
                </div>
                <div>
                   <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#546e7a', marginBottom: '5px' }}>Próxima Dosis</h4>
                   <p style={{ fontSize: '0.95rem', color: record.nextDoseDate ? 'inherit' : 'var(--text-muted)' }}>
                     {record.nextDoseDate 
                       ? new Date(record.nextDoseDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) 
                       : 'No programada'}
                   </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnimalVaccines;
