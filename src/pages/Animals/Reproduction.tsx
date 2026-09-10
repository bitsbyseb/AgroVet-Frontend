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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate('/animals')} 
          className="btn bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 shadow-xs inline-flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>Regresar</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Heart className="text-pink-600" size={28} />
            <span>Registro Reproductivo: <span className="text-pink-600">{animal?.name}</span></span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {animal?.species} • {animal?.breed} • {animal?.gender === 'male' ? 'Macho' : 'Hembra'}
          </p>
        </div>
        
        {canAddReproduction && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)} 
            className="btn btn-primary bg-pink-600 hover:bg-pink-700 text-white inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={18} />
            <span>Nuevo Evento</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <div className="card bg-white rounded-xl shadow-md border border-pink-200 p-6">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Heart size={20} className="text-pink-600" />
              <span>Agregar Nuevo Evento Reproductivo</span>
            </h2>
            <button 
              onClick={() => setShowAddForm(false)} 
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition inline-flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estado Reproductivo <span className="text-red-500">*</span></label>
                <select 
                  className="form-control w-full text-sm"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de Reproducción <span className="text-red-500">*</span></label>
                <select 
                  className="form-control w-full text-sm"
                  value={formData.breedingType}
                  onChange={(e) => setFormData({...formData, breedingType: e.target.value})}
                >
                  <option value="natural">Monta Natural</option>
                  <option value="artificial">Inseminación Artificial</option>
                  <option value="embryo_transfer">Transferencia de Embriones</option>
                </select>
              </div>

              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha de Último Parto (Opcional)</label>
                <input 
                  type="date" 
                  className="form-control w-full text-sm" 
                  value={formData.lastCalvingDate}
                  onChange={(e) => setFormData({...formData, lastCalvingDate: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Número de Crías <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  min="0"
                  className="form-control w-full text-sm" 
                  value={formData.offspringCount}
                  onChange={(e) => setFormData({...formData, offspringCount: Number(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="btn bg-gray-100 hover:bg-gray-200 text-gray-700 transition inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <X size={18} />
                <span>Cancelar</span>
              </button>
              <button 
                type="submit" 
                className="btn btn-primary bg-pink-600 hover:bg-pink-700 text-white transition inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer" 
                disabled={saving}
              >
                <Save size={18} />
                <span>{saving ? 'Guardando...' : 'Guardar Evento'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {reproduction.length === 0 ? (
          <div className="card bg-white rounded-xl shadow-xs border border-gray-100 text-center py-16 px-4">
            <Activity size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No hay eventos reproductivos</h3>
            <p className="text-xs text-gray-500 mt-1">Este animal no cuenta con registros reproductivos ingresados.</p>
          </div>
        ) : (
          reproduction.map((record) => (
            <div key={record.id} className="card bg-white rounded-xl shadow-xs border-l-4 border-l-pink-500 border border-gray-100 p-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center shrink-0">
                    <Heart size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base capitalize">
                      Estado: {record.reproductiveStatus}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Crías: {record.offspringCount} | Tipo: {record.breedingType || 'N/A'}
                    </p>
                    {record.lastCalvingDate && (
                      <p className="text-xs text-gray-500 mt-0.5">
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
