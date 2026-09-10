import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { animalService, foodService, authService } from '../../services/api';
import type { Animal, DietRecord, DietInput, Food } from '../../types';
import { ArrowLeft, Plus, Save, X, Utensils, Wheat } from 'lucide-react';

const AnimalDiet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [diet, setDiet] = useState<DietRecord[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<DietInput>({
    foodId: '',
    quantity: 0,
    frequency: 'Diario'
  });

  // Only Zootechnician can add diet records
  const canAddDiet = currentUser?.role === 'zootechnician';

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
        const [dietData, foodsData] = await Promise.all([
          animalService.getDiet(id!),
          foodService.list()
        ]);
        setDiet(dietData);
        setFoods(foodsData);
      } catch (err: unknown) {
        if ((err as { response?: { data?: { error?: string }, status?: number } }).response?.status === 403) {
          setForbidden(true);
        } else {
          throw err;
        }
      }
    } catch(err) {
      // eslint-disable-next-line no-unused-vars

      console.error('Error fetching diet:', err);
      setError('No se pudo cargar la información de alimentación.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser) return;
    
    setSaving(true);
    try {
      await animalService.addDiet(id, formData);
      setShowAddForm(false);
      setFormData({
        foodId: '',
        quantity: 0,
        frequency: 'Diario'
      });
      fetchData(); // Refresh list
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string }, status?: number } }).response?.data?.error || 'Error al guardar el registro de alimentación.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando datos de alimentación...</div>;

  if (forbidden) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error)' }}>Acceso Denegado</h2>
        <p>Tu rol actual no tiene permisos para ver o modificar la alimentación.</p>
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
            <Utensils className="text-orange-600" size={28} />
            <span>Plan de Alimentación: <span className="text-orange-600">{animal?.name}</span></span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {animal?.species} • {animal?.breed} • {animal?.gender === 'male' ? 'Macho' : 'Hembra'}
          </p>
        </div>
        
        {canAddDiet && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)} 
            className="btn btn-primary bg-orange-600 hover:bg-orange-700 text-white inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
          >
            <Plus size={18} />
            <span>Asignar Dieta</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 text-red-800 rounded-r-md shadow-xs flex items-center gap-2 text-sm">
          <span>{error}</span>
        </div>
      )}

      {showAddForm && (
        <div className="card bg-white rounded-xl shadow-md border border-orange-200 p-6">
          <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Utensils size={20} className="text-orange-600" />
              <span>Asignar Nuevo Plan de Alimentación</span>
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
              <div className="form-group md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alimento <span className="text-red-500">*</span></label>
                <select 
                  className="form-control w-full text-sm"
                  value={formData.foodId}
                  onChange={(e) => setFormData({...formData, foodId: e.target.value})}
                  required
                >
                  <option value="">-- Seleccionar Alimento --</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name} ({food.type})
                    </option>
                  ))}
                </select>
                {foods.length === 0 && (
                  <p className="text-xs text-red-600 mt-1.5">
                    No hay alimentos registrados en el catálogo. Registra un alimento primero.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cantidad (kg) <span className="text-red-500">*</span></label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  className="form-control w-full text-sm" 
                  placeholder="Ej: 2.5"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData({...formData, quantity: Number(e.target.value)})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Frecuencia <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="form-control w-full text-sm" 
                  placeholder="Ej: Diario, 2 veces al día..."
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
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
                className="btn btn-primary bg-orange-600 hover:bg-orange-700 text-white transition inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer" 
                disabled={saving || foods.length === 0}
              >
                <Save size={18} />
                <span>{saving ? 'Guardando...' : 'Guardar Dieta'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {diet.length === 0 ? (
          <div className="card bg-white rounded-xl shadow-xs border border-gray-100 text-center py-16 px-4">
            <Utensils size={48} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700">No hay plan de alimentación</h3>
            <p className="text-xs text-gray-500 mt-1">Este animal no cuenta con raciones o dietas asignadas.</p>
          </div>
        ) : (
          diet.map((record) => (
            <div key={record.id} className="card bg-white rounded-xl shadow-xs border-l-4 border-l-orange-500 border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                    <Wheat size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {record.food?.name || 'Alimento Desconocido'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Asignado el {new Date(record.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-gray-50/75 p-3.5 rounded-lg border border-gray-100">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Cantidad</h4>
                  <p className="text-lg font-bold text-orange-600 mt-0.5">{record.quantity} kg</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Frecuencia</h4>
                  <p className="text-base font-semibold text-gray-800 mt-0.5">{record.frequency}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnimalDiet;
