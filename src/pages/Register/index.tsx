import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { authService, ownerService } from '../../services/api';
import type { UserRole, Owner } from '../../types';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  PawPrint,
  Stethoscope,
  Wheat,
  UserPlus,
  ExternalLink,
  Info,
  Check
} from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role === 'administrator';

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('owner');
  const [showPassword, setShowPassword] = useState(false);

  // Estado para vincular propietarios existentes
  const [existingOwners, setExistingOwners] = useState<Owner[]>([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ username: string; email: string; role: UserRole } | null>(null);

  // Datos del perfil del propietario (cuando role === 'owner')
  const [ownerName, setOwnerName] = useState('');
  const [ownerDocument, setOwnerDocument] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerAddress, setOwnerAddress] = useState('');
  const [ownerType, setOwnerType] = useState<'urban' | 'rural'>('urban');

  // Cargar lista de propietarios para autocompletar si se selecciona rol "owner"
  useEffect(() => {
    if (isAdmin) {
      fetchOwners();
    }
  }, [isAdmin]);

  const fetchOwners = async () => {
    setLoadingOwners(true);
    try {
      const data = await ownerService.list();
      setExistingOwners(data);
    } catch {
      // No bloqueante si falla la lista
    } finally {
      setLoadingOwners(false);
    }
  };

  const handleOwnerSelect = (ownerId: string) => {
    setSelectedOwnerId(ownerId);
    if (!ownerId) return;

    const owner = existingOwners.find((o) => o.id === ownerId);
    if (owner) {
      if (owner.email) {
        setEmail(owner.email);
      }
      if (owner.name) {
        setOwnerName(owner.name);
      }
      if (owner.document) {
        setOwnerDocument(owner.document);
      }
      if (owner.phone) {
        setOwnerPhone(owner.phone);
      }
      if (owner.address) {
        setOwnerAddress(owner.address);
      }
      if (owner.ownerType) {
        setOwnerType(owner.ownerType);
      }

      const suggestedUsername = owner.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 20);

      if (!username || username.trim() === '') {
        setUsername(suggestedUsername);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3) {
      setError('El nombre de usuario debe contener al menos 3 caracteres.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Por favor, ingresa una dirección de correo electrónico válida.');
      return;
    }

    if (password.length < 10) {
      setError('La contraseña debe tener un mínimo de 10 caracteres por motivos de seguridad.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas ingresadas no coinciden. Por favor verifícalas cuidadosamente.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        role
      };

      if (role === 'owner') {
        payload.ownerData = {
          name: ownerName.trim() || undefined,
          document: ownerDocument.trim() || undefined,
          phone: ownerPhone.trim() || undefined,
          address: ownerAddress.trim() || undefined,
          ownerType: ownerType || 'urban'
        };
      }

      await authService.signup(payload);

      setCreatedUser({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        role
      });
    } catch (err: unknown) {
      const axiosError = err as Record<string, unknown>;
      const apiError = (axiosError.response as Record<string, unknown>)?.data as Record<string, any>;
      let errorMessage = 'Error al registrar el usuario en el sistema. Por favor revisa los datos.';

      if (apiError) {
        if (typeof apiError.error === 'string') {
          errorMessage = apiError.error;
        } else if (apiError.error?.message) {
          errorMessage = apiError.error.message;
        } else if (Array.isArray(apiError.errors) && apiError.errors.length > 0) {
          errorMessage = typeof apiError.errors[0] === 'string' ? apiError.errors[0] : JSON.stringify(apiError.errors[0]);
        } else if (typeof apiError === 'object' && apiError.message) {
          errorMessage = apiError.message;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSelectedOwnerId('');
    setOwnerName('');
    setOwnerDocument('');
    setOwnerPhone('');
    setOwnerAddress('');
    setOwnerType('urban');
    setError(null);
    setCreatedUser(null);
  };

  // ─── Vista de Bloqueo si no es Administrador ───
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center ring-8 ring-amber-50/50">
            <ShieldCheck size={36} />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
              Acceso Exclusivo de Administrador
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              La creación y asignación de cuentas de usuario en <strong>AgroVet</strong> (Veterinarios, Zootecnistas y Propietarios de animales) solo puede ser realizada por administradores autorizados.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20"
            >
              <span>Iniciar Sesión como Administrador</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Vista de Éxito tras crear usuario ───
  if (createdUser) {
    const roleLabels: Record<string, { label: string; icon: any; bgBadge: string }> = {
      owner: { label: 'Propietario / Dueño', icon: PawPrint, bgBadge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      veterinarian: { label: 'Veterinario', icon: Stethoscope, bgBadge: 'bg-blue-50 text-blue-700 border-blue-200' },
      zootechnician: { label: 'Zootecnista', icon: Wheat, bgBadge: 'bg-amber-50 text-amber-700 border-amber-200' },
      administrator: { label: 'Administrador', icon: ShieldCheck, bgBadge: 'bg-purple-50 text-purple-700 border-purple-200' },
    };

    const currentMeta = roleLabels[createdUser.role] || roleLabels.owner;
    const MetaIcon = currentMeta.icon;

    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-gray-100 p-8 sm:p-12 text-center space-y-8">
          <div className="w-20 h-20 mx-auto bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center ring-8 ring-emerald-50/60 shadow-xs">
            <CheckCircle2 size={44} />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              ¡Usuario Creado con Éxito!
            </h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
              La cuenta se encuentra activa en el sistema y lista para iniciar sesión en AgroVet.
            </p>
          </div>

          {/* Tarjeta de Resumen */}
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-6 text-left space-y-4">
            <div className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-3">
              <span className="text-gray-500 font-medium">Nombre de Usuario:</span>
              <span className="font-bold text-gray-900 tracking-wide">{createdUser.username}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b border-slate-200/60 pb-3">
              <span className="text-gray-500 font-medium">Correo Electrónico:</span>
              <span className="font-semibold text-gray-800">{createdUser.email}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Rol Asignado:</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentMeta.bgBadge}`}>
                <MetaIcon size={14} />
                <span>{currentMeta.label}</span>
              </span>
            </div>
          </div>

          {createdUser.role === 'owner' && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs sm:text-sm text-emerald-800 text-left flex items-start gap-3 leading-relaxed">
              <PawPrint size={18} className="shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <strong>Acceso habilitado para el Propietario:</strong> Este usuario podrá acceder directamente al portal de <em>Mis Animales</em> y <em>Recordatorios</em> para consultar el estado clínico de sus ejemplares.
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleResetForm}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/20 hover:shadow-lg cursor-pointer"
            >
              <UserPlus size={18} />
              <span>Crear otro usuario</span>
            </button>
            {createdUser.role === 'owner' && (
              <button
                onClick={() => navigate('/owners')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                <span>Ver Propietarios</span>
                <ExternalLink size={15} />
              </button>
            )}
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>Ir al Panel</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulario Principal de Creación de Usuarios ───
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Barra de Navegación Superior */}
        <div className="flex items-center justify-between mb-8 px-1">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-emerald-700 transition-colors group cursor-pointer"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver al Panel Principal</span>
          </button>

          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100/90 text-emerald-800 border border-emerald-200">
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>Panel de Administración</span>
          </span>
        </div>

        {/* Tarjeta del Formulario Principal */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-200/70 p-8 sm:p-12 mb-10">
          {/* Encabezado */}
          <div className="text-center mb-10 pb-8 border-b border-gray-100">
            <div className="inline-flex p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/20 mb-4">
              <UserPlus size={30} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-3">
              Crear Nuevo Usuario
            </h1>
            <p className="text-sm sm:text-base text-gray-500 max-w-lg mx-auto leading-relaxed">
              Registra credenciales para veterinarios, zootecnistas o propietarios que interactúan con el sistema.
            </p>
          </div>

          {/* Banner de Error */}
          {error && (
            <div className="mb-8 p-5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 flex items-start gap-3.5 text-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ─── 1. Selector de Rol con Cards Visuales ─── */}
            <div className="mb-10">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                1. Selecciona el Tipo de Usuario / Rol
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Opción 1: Propietario */}
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    role === 'owner'
                      ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/30 text-emerald-950 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`p-2.5 rounded-xl transition-colors ${
                        role === 'owner' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <PawPrint size={20} />
                    </span>
                    {role === 'owner' && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-base font-bold block text-gray-900 mb-1">Propietario</span>
                    <span className="text-xs text-gray-500 block leading-snug">Portal de consultas y recordatorios</span>
                  </div>
                </button>

                {/* Opción 2: Veterinario */}
                <button
                  type="button"
                  onClick={() => setRole('veterinarian')}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    role === 'veterinarian'
                      ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/30 text-blue-950 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`p-2.5 rounded-xl transition-colors ${
                        role === 'veterinarian' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <Stethoscope size={20} />
                    </span>
                    {role === 'veterinarian' && (
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-base font-bold block text-gray-900 mb-1">Veterinario</span>
                    <span className="text-xs text-gray-500 block leading-snug">Gestión clínica y vacunas</span>
                  </div>
                </button>

                {/* Opción 3: Zootecnista */}
                <button
                  type="button"
                  onClick={() => setRole('zootechnician')}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    role === 'zootechnician'
                      ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/30 text-amber-950 shadow-xs'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`p-2.5 rounded-xl transition-colors ${
                        role === 'zootechnician' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      <Wheat size={20} />
                    </span>
                    {role === 'zootechnician' && (
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-base font-bold block text-gray-900 mb-1">Zootecnista</span>
                    <span className="text-xs text-gray-500 block leading-snug">Nutrición, potreros y dietas</span>
                  </div>
                </button>
              </div>
            </div>

            {/* ─── Ayuda y Vinculación para Propietarios ─── */}
            {role === 'owner' && (
              <div className="mb-10 p-6 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl space-y-6 shadow-2xs">
                <div className="flex items-start gap-3 text-sm text-emerald-950 leading-relaxed">
                  <Info size={20} className="shrink-0 mt-0.5 text-emerald-700" />
                  <div>
                    <strong className="font-bold block mb-1">Registro Unificado de Propietario</strong>
                    Puedes ingresar los datos del propietario aquí mismo para crear su perfil en el sistema y asignarle credenciales de acceso al instante. También aparecerá registrado en la sección de <em>Propietarios</em>.
                  </div>
                </div>

                {/* Selector Opcional de Propietarios Registrados */}
                {existingOwners.length > 0 && (
                  <div className="pt-4 border-t border-emerald-200/60">
                    <label htmlFor="ownerSelect" className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">
                      ¿Deseas autocompletar con un Propietario ya registrado? (Opcional)
                    </label>
                    <select
                      id="ownerSelect"
                      value={selectedOwnerId}
                      onChange={(e) => handleOwnerSelect(e.target.value)}
                      className="w-full text-sm py-3 px-4 bg-white border border-emerald-300 text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden transition-all shadow-2xs"
                    >
                      <option value="">
                        {loadingOwners ? 'Cargando lista de propietarios...' : '-- Ingresar nuevo propietario manualmente --'}
                      </option>
                      {existingOwners.map((own) => (
                        <option key={own.id} value={own.id}>
                          {own.name} (CC: {own.document}) — {own.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Campos de Perfil de Propietario */}
                <div className="pt-4 border-t border-emerald-200/60 space-y-5">
                  <span className="block text-xs font-bold text-emerald-900 uppercase tracking-wider">
                    Datos del Perfil del Propietario
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="ownerName" className="block text-xs font-bold text-gray-700 mb-1.5">
                        Nombre Completo del Propietario
                      </label>
                      <input
                        id="ownerName"
                        type="text"
                        placeholder="Ej. Juan Carlos Pérez"
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-emerald-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-hidden transition-all shadow-xs"
                      />
                    </div>

                    <div>
                      <label htmlFor="ownerDocument" className="block text-xs font-bold text-gray-700 mb-1.5">
                        Cédula / Documento de Identidad
                      </label>
                      <input
                        id="ownerDocument"
                        type="text"
                        placeholder="Ej. 1023456789"
                        value={ownerDocument}
                        onChange={(e) => setOwnerDocument(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-emerald-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-hidden transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="ownerPhone" className="block text-xs font-bold text-gray-700 mb-1.5">
                        Teléfono de Contacto
                      </label>
                      <input
                        id="ownerPhone"
                        type="text"
                        placeholder="Ej. 3101234567"
                        value={ownerPhone}
                        onChange={(e) => setOwnerPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-emerald-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-hidden transition-all shadow-xs"
                      />
                    </div>

                    <div>
                      <label htmlFor="ownerAddress" className="block text-xs font-bold text-gray-700 mb-1.5">
                        Dirección o Predio
                      </label>
                      <input
                        id="ownerAddress"
                        type="text"
                        placeholder="Ej. Calle 12 #34 o Vereda La Vega"
                        value={ownerAddress}
                        onChange={(e) => setOwnerAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm text-gray-900 bg-white border border-emerald-200 rounded-xl focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 focus:outline-hidden transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2">
                      Ámbito del Propietario
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setOwnerType('urban')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          ownerType === 'urban'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Urbano (Mascotas)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOwnerType('rural')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          ownerType === 'rural'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Rural (Productivo)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── 2. Datos de Cuenta (Inputs Limpios sin Iconos Dentro) ─── */}
            <div className="mb-8">
              <label htmlFor="username" className="block text-sm font-semibold text-gray-800 mb-2.5">
                Nombre de Usuario
              </label>
              <input
                id="username"
                type="text"
                placeholder="Ejemplo: juan_perez"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 text-base text-gray-900 bg-white border border-gray-300 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 focus:outline-hidden transition-all shadow-xs"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Identificador único con el que el usuario iniciará sesión (mínimo 3 caracteres).
              </p>
            </div>

            <div className="mb-8">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-800 mb-2.5">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="ejemplo@agrovet.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 text-base text-gray-900 bg-white border border-gray-300 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 focus:outline-hidden transition-all shadow-xs"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Se enviará una notificación de bienvenida y confirmación a esta dirección.
              </p>
            </div>

            {/* ─── 3. Contraseñas en Grid Espacioso ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2.5">
                  Contraseña
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 10 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 text-base text-gray-900 bg-white border border-gray-300 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 focus:outline-hidden transition-all shadow-xs"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-800 mb-2.5">
                  Confirmar Contraseña
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3.5 text-base text-gray-900 bg-white border border-gray-300 rounded-xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 focus:outline-hidden transition-all shadow-xs"
                  required
                />
              </div>
            </div>

            {/* Control para mostrar contraseñas y requisitos */}
            <div className="mb-10 flex items-center justify-between px-1">
              <label className="inline-flex items-center gap-2.5 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 cursor-pointer"
                />
                <span>Mostrar contraseñas</span>
              </label>

              <span className="text-xs text-gray-400">
                Mínimo 10 caracteres de longitud
              </span>
            </div>

            {/* ─── Botón de Envío ─── */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base transition-all shadow-lg shadow-emerald-700/20 hover:shadow-xl hover:shadow-emerald-700/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Registrando cuenta de usuario...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>Crear Cuenta de Usuario</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
