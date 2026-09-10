import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { animalService, authService } from '../../services/api';
import type { Animal, ProductionRecord, ProductionInput } from '../../types';
import { ArrowLeft, Plus, Save, X, Calendar, Package, Droplet, Scale } from 'lucide-react';

const AnimalProduction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProductionInput>({
    date: new Date().toISOString().split('T')[0],
    type: 'Leche',
    quantity: 0,
    unit: 'Litros',
    purpose: 'milk'
  });

  // Only Zootechnician can add production records
  const canAddProduction = currentUser?.role === 'zootechnician';

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [animalData, productionData] = await Promise.all([
        animalService.getById(id!),
        animalService.getProduction(id!)
      ]);
      setAnimal(animalData);
      setProduction(productionData);
    } catch(err) {
      // eslint-disable-next-line no-unused-vars

      console.error('Error fetching production:', err);
      setError('No se pudo cargar la información de producción.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    
    const submissionData = {
        ...formData,
        date: new Date(formData.date).toISOString(),
        quantity: Number(formData.quantity)
    };

    setSaving(true);
    try {
      await animalService.addProduction(id, submissionData);
      setShowAddForm(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Leche',
        quantity: 0,
        unit: 'Litros',
        purpose: 'milk'
      });
      fetchData(); // Refresh list
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string }, status?: number } }).response?.data?.error || 'Error al guardar el registro de producción.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando datos de producción...</div>;

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
            <Package className="text-emerald-700" size={28} />
            <span>Registro de Producción: <span className="text-emerald-700">{animal?.name}</span></span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {animal?.species} • {animal?.breed} • {animal?.gender === 'male' ? 'Macho' : 'Hembra'}
          </p>
        </div>
        
        {canAddProduction && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)} 
            className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={18} />
            <span>Nuevo Registro</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <div className="card bg-white rounded-xl shadow-md border border-emerald-200 p-6">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Package size={20} className="text-emerald-700" />
              <span>Agregar Nuevo Registro de Producción</span>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha de Registro <span className="text-red-500">*</span></label>
                <input 
                  type="date" 
                  className="form-control w-full text-sm" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de Producto <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="form-control w-full text-sm" 
                  placeholder="Ej: Leche, Carne, Huevos..."
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cantidad <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="form-control w-full text-sm" 
                  placeholder="Ej: 15.5"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unidad de Medida <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="form-control w-full text-sm" 
                  placeholder="Ej: Litros, Kg..."
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  required
                />
              </div>

              <div className="form-group md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Propósito <span className="text-red-500">*</span></label>
                <select 
                  className="form-control w-full text-sm"
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  required
                >
                  <option value="milk">Leche</option>
                  <option value="meat">Carne</option>
                  <option value="eggs">Huevos</option>
                  <option value="wool">Lana</option>
                  <option value="dual">Doble Propósito</option>
                  <option value="other">Otro</option>
                </select>
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
                className="btn btn-primary bg-emerald-700 hover:bg-emerald-800 text-white transition inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer" 
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
        {production.length === 0 ? (
          <div className="card bg-white rounded-xl shadow-xs border border-gray-100 text-center py-16 px-4">
            <Package size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No hay registros de producción</h3>
            <p className="text-xs text-gray-500 mt-1">Este animal no cuenta con lotes productivos ingresados.</p>
          </div>
        ) : (
          production.map((record) => (
            <div key={record.id} className="card bg-white rounded-xl shadow-xs border-l-4 border-l-emerald-600 border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {record.type}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize">
                      {new Date(record.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-gray-50/75 p-3.5 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-lg flex items-center justify-center shrink-0">
                    <Scale size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Cantidad</h4>
                    <p className="text-lg font-bold text-emerald-700">{record.quantity} {record.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-lg flex items-center justify-center shrink-0">
                    <Droplet size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Tipo & Propósito</h4>
                    <p className="text-base font-semibold text-gray-800">{record.type}</p>
                    {record.purpose && (
                      <p className="text-xs text-gray-500 capitalize">Propósito: {record.purpose}</p>
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

export default AnimalProduction;
