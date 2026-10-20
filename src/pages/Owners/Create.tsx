import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ownerService, authService } from '../../services/api';
import type { OwnerInput } from '../../types';
import { ArrowLeft, Save, User, FileText, Phone, Mail, MapPin, Building, Trees, AlertCircle, Loader2, KeyRound } from 'lucide-react';

const CreateOwner: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<OwnerInput>({
    name: '',
    document: '',
    phone: '',
    email: '',
    address: '',
    ownerType: 'urban'
  });
  const [createPortalAccount, setCreatePortalAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones frontend
    if (formData.name.trim().length < 3) {
      setError('El nombre completo debe tener al menos 3 caracteres.');
      return;
    }
    if (!/^\d+$/.test(formData.document.trim())) {
      setError('El documento de identidad debe contener únicamente dígitos numéricos.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (createPortalAccount) {
      if (password.length < 10) {
        setError('La contraseña para el portal del propietario debe tener al menos 10 caracteres.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      if (createPortalAccount) {
        const generatedUsername = username.trim() || formData.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '_')
          .slice(0, 20);

        await authService.signup({
          username: generatedUsername,
          email: formData.email.trim().toLowerCase(),
          password,
          role: 'owner',
          ownerData: {
            name: formData.name.trim(),
            document: formData.document.trim(),
            phone: formData.phone.trim(),
            address: formData.address.trim(),
            ownerType: formData.ownerType
          }
        });
      } else {
        await ownerService.create({
          ...formData,
          name: formData.name.trim(),
          document: formData.document.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
        });
      }
      navigate('/owners');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Error al registrar el propietario. Verifica que el documento o correo no estén ya registrados.');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="border-b border-gray-100 pb-5 mb-6">
          <h1 className="text-xl font-bold text-gray-900">Registrar Nuevo Propietario</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ingresa la información básica y de contacto del dueño o tutor responsable
          </p>
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
                placeholder="Ej. Juan Carlos Pérez Gómez"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Documento y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Documento de Identidad <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs"
                  placeholder="Solo dígitos (ej. 1023456789)"
                  value={formData.document}
                  onChange={(e) => setFormData({...formData, document: e.target.value.replace(/\D/g, '')})}
                  required
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">Sin puntos ni espacios</span>
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
                  placeholder="Ej. 3101234567"
                  value={formData.phone}
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
                placeholder="juan.perez@ejemplo.com"
                value={formData.email}
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
                placeholder="Calle 12 # 34-56 o Vereda El Encanto, Finca La Esperanza"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Ámbito / Tipo de Propietario (Selector en Tarjetas) */}
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
                    Tutor de animales domésticos o mascotas (caninos, felinos).
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
                    Productor agropecuario o dueño de especies de producción (bovinos, equinos, etc.).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Opción de crear usuario para el portal */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={createPortalAccount}
                onChange={(e) => setCreatePortalAccount(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
              />
              <div>
                <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <KeyRound size={16} className="text-emerald-700" />
                  Crear cuenta de acceso al portal para este propietario
                </span>
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                  Permite al propietario iniciar sesión en AgroVet para consultar sus animales, historiales y recordatorios clínicos.
                </p>
              </div>
            </label>

            {createPortalAccount && (
              <div className="pt-3 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Nombre de Usuario (Opcional - se autogenera si se deja vacío)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. juan_perez"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Contraseña de Acceso <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 10 caracteres"
                    className="w-full px-3.5 py-2 text-sm bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    required={createPortalAccount}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/owners')}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-medium text-sm transition-colors shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Registrar Propietario</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOwner;
