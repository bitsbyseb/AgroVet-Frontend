import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ownerService } from '../../services/api';
import type { OwnerUpdateInput } from '../../types';
import { ArrowLeft, Save, User, FileText, Phone, Mail, MapPin, Building, Trees, AlertCircle, Loader2, Lock } from 'lucide-react';

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
        setLoading(true);
        setError(null);
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
        const axiosError = err as { response?: { data?: { error?: string } } };
        setError(axiosError.response?.data?.error || 'No se pudo cargar la información del propietario solicitado.');
      } finally {
        setLoading(false);
      }
    };
    fetchOwner();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    if (formData.name && formData.name.trim().length < 3) {
      setError('El nombre completo debe tener al menos 3 caracteres.');
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await ownerService.update(id, {
        name: formData.name?.trim(),
        phone: formData.phone?.trim(),
        email: formData.email?.trim(),
        address: formData.address?.trim(),
        ownerType: formData.ownerType,
      });
      navigate('/owners');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Error al actualizar la información del propietario.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-gray-200 rounded-md animate-pulse" />
        <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-4 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded-md" />
          <div className="h-4 w-64 bg-gray-100 rounded-md" />
          <div className="space-y-4 pt-4">
            <div className="h-10 bg-gray-100 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-100 rounded-xl" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
            <div className="h-10 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Botón Volver */}
      <button 
        onClick={() => navigate('/owners')} 
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={18} />
        <span>Volver a la lista de propietarios</span>
      </button>

      {/* Tarjeta del Formulario */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
        <div className="border-b border-gray-100 pb-5 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Editar Propietario</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Actualiza los datos de contacto y entorno del propietario
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 w-fit">
            <Lock size={12} className="text-gray-400" />
            <span>Doc: {document}</span>
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-600" />
            <div className="flex-1 text-sm">{error}</div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nombre Completo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Documento (Bloqueado) y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                <span>Documento de Identidad</span>
                <span className="text-[11px] text-gray-400 font-normal">Inmutable</span>
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm cursor-not-allowed font-mono"
                  value={document}
                  disabled
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Teléfono de Contacto <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                  required
                />
              </div>
            </div>
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Correo Electrónico <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="email" 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs"
                value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Dirección de Residencia o Predio <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs"
                value={formData.address || ''}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Ámbito o Entorno */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Ámbito o Entorno de Explotación <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Urbano */}
              <label 
                className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.ownerType === 'urban'
                    ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input 
                  type="radio"
                  name="ownerType"
                  value="urban"
                  checked={formData.ownerType === 'urban'}
                  onChange={() => setFormData({...formData, ownerType: 'urban'})}
                  className="mt-1 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <Building size={16} className="text-sky-600" />
                    <span>Urbano</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Mascotas y animales de compañía.
                  </p>
                </div>
              </label>

              {/* Rural */}
              <label 
                className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  formData.ownerType === 'rural'
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <input 
                  type="radio"
                  name="ownerType"
                  value="rural"
                  checked={formData.ownerType === 'rural'}
                  onChange={() => setFormData({...formData, ownerType: 'rural'})}
                  className="mt-1 text-amber-600 focus:ring-amber-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <Trees size={16} className="text-amber-600" />
                    <span>Rural</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Animales de granja y producción agropecuaria.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/owners')}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-medium text-sm transition-colors shadow-xs disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Guardando cambios...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOwner;
