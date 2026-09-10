import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { animalService, authService } from '../../services/api';
import type { Animal, VaccineRecord, VaccineInput } from '../../types';
import { ArrowLeft, Plus, Syringe, Save, X, User as UserIcon, FileText } from 'lucide-react';

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
    } catch(err) {
      // eslint-disable-next-line no-unused-vars

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
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string }, status?: number } }).response?.data?.error || 'Error al guardar la vacuna.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando vacunas...</div>;

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
            <Syringe className="text-cyan-700" size={28} />
            <span>Registro de Vacunas: <span className="text-cyan-700">{animal?.name}</span></span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {animal?.species} • {animal?.breed} • {animal?.gender === 'male' ? 'Macho' : 'Hembra'}
          </p>
        </div>
        
        {canAddVaccine && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)} 
            className="btn btn-primary bg-cyan-700 hover:bg-cyan-800 text-white inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={18} />
            <span>Nueva Vacuna</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <div className="card bg-white rounded-xl shadow-md border border-cyan-200 p-6">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Syringe size={20} className="text-cyan-700" />
              <span>Registrar Nueva Vacuna</span>
            </h2>
            <button 
              onClick={() => setShowAddForm(false)} 
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition inline-flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombre de la Vacuna <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                className="form-control w-full text-sm" 
                placeholder="Ej: Antirrábica, Parvovirus..."
                value={formData.vaccineName}
                onChange={(e) => setFormData({...formData, vaccineName: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha de Aplicación <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  className="form-control w-full text-sm" 
                  value={formData.applicationDate}
                  onChange={(e) => setFormData({...formData, applicationDate: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Próxima Dosis (Opcional)</label>
                <input 
                  type="date" 
                  className="form-control w-full text-sm" 
                  value={formData.nextDoseDate}
                  onChange={(e) => setFormData({...formData, nextDoseDate: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Número de Lote (Opcional)</label>
              <input 
                type="text" 
                className="form-control w-full text-sm" 
                placeholder="Ej: LOTE-12345"
                value={formData.batchNumber}
                onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
              />
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
                className="btn btn-primary bg-cyan-700 hover:bg-cyan-800 text-white transition inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer" 
                disabled={saving}
              >
                <Save size={18} />
                <span>{saving ? 'Guardando...' : 'Guardar Registro'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {vaccines.length === 0 ? (
          <div className="card bg-white rounded-xl shadow-xs border border-gray-100 text-center py-16 px-4">
            <FileText size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No hay vacunas registradas</h3>
            <p className="text-xs text-gray-500 mt-1">Este animal no cuenta con esquemas de vacunación ingresados.</p>
          </div>
        ) : (
          vaccines.map((record) => (
            <div key={record.id} className="card bg-white rounded-xl shadow-xs border-l-4 border-l-cyan-600 border border-gray-100 p-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-50 text-cyan-700 rounded-xl flex items-center justify-center shrink-0">
                    <Syringe size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{record.vaccineName}</h3>
                    <p className="text-xs text-gray-500">
                      Aplicada: {new Date(record.applicationDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                {record.administeredBy && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                    <UserIcon size={14} />
                    <span>{record.administeredBy.username} ({record.administeredBy.role})</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="bg-gray-50/75 p-3.5 rounded-lg border border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Lote</h4>
                  <p className="text-sm text-gray-800 font-medium">{record.batchNumber || 'N/A'}</p>
                </div>
                <div className="bg-gray-50/75 p-3.5 rounded-lg border border-gray-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Próxima Dosis</h4>
                  <p className="text-sm text-gray-800 font-medium">
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
