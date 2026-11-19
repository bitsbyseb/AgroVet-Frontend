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
  UserPlus,
  ExternalLink,
  Info
} from 'lucide-react';

const ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: 'Propietario o tutor: accede al portal para consultar sus animales, historiales y recordatorios.',
  veterinarian: 'Veterinario: gestiona historial clínico, vacunas y consultas veterinarias.',
  zootechnician: 'Zootecnista: gestiona alimentación, dietas, producción, reproducción y potreros.'
};

const ROLE_LABELS: Record<string, string> = {
  owner: 'Propietario',
  veterinarian: 'Veterinario',
  zootechnician: 'Zootecnista',
  administrator: 'Administrador'
};

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
      <div className="max-w-xl mx-auto">
        <div className="card" style={{ border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 20px',
              backgroundColor: '#fff8e1',
              color: '#f57f17',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '10px' }}>
            Acceso Exclusivo de Administrador
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '25px' }}>
            La creación y asignación de cuentas de usuario en <strong>AgroVet</strong> (veterinarios,
            zootecnistas y propietarios) solo puede ser realizada por administradores autorizados.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ backgroundColor: '#2e7d32', width: '100%' }}>
            Iniciar Sesión como Administrador
          </Link>
        </div>
      </div>
    );
  }

  // ─── Vista de Éxito tras crear usuario ───
  if (createdUser) {
    return (
      <div className="max-w-xl mx-auto">
        <div className="card" style={{ border: '1px solid #2e7d32' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 16px',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CheckCircle2 size={30} />
            </div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '6px' }}>
              ¡Usuario Creado con Éxito!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              La cuenta se encuentra activa y lista para iniciar sesión en AgroVet.
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#fafafa',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '18px 20px',
              marginBottom: '20px'
            }}
          >
            <div className="flex justify-between items-center" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nombre de Usuario</span>
              <strong style={{ fontSize: '0.9rem' }}>{createdUser.username}</strong>
            </div>
            <div className="flex justify-between items-center" style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Correo Electrónico</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, textAlign: 'right', wordBreak: 'break-all' }}>
                {createdUser.email}
              </span>
            </div>
            <div className="flex justify-between items-center" style={{ paddingTop: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Rol Asignado</span>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 12px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  border: '1px solid #c8e6c9'
                }}
              >
                {ROLE_LABELS[createdUser.role] ?? createdUser.role}
              </span>
            </div>
          </div>

          {createdUser.role === 'owner' && (
            <div
              className="flex items-start gap-10"
              style={{
                backgroundColor: '#f1f8e9',
                border: '1px solid #dcedc8',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '0.85rem',
                color: '#33691e',
                marginBottom: '20px'
              }}
            >
              <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Este usuario podrá acceder al portal de <em>Mis Animales</em> y <em>Recordatorios</em>
                para consultar el estado clínico de sus ejemplares.
              </span>
            </div>
          )}

          <div className="flex items-center justify-end gap-10">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="btn"
              style={{ backgroundColor: '#eceff1', color: '#37474f' }}
            >
              Ir al Panel
            </button>
            {createdUser.role === 'owner' && (
              <button
                type="button"
                onClick={() => navigate('/owners')}
                className="btn"
                style={{ backgroundColor: '#eceff1', color: '#37474f' }}
              >
                Ver Propietarios
                <ExternalLink size={15} />
              </button>
            )}
            <button
              type="button"
              onClick={handleResetForm}
              className="btn btn-primary"
              style={{ backgroundColor: '#2e7d32' }}
            >
              <UserPlus size={18} />
              Crear Otro Usuario
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulario Principal de Creación de Usuarios ───
  return (
    <div className="max-w-3xl mx-auto">
      {/* Botón Volver */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        style={{ marginBottom: '20px' }}
      >
        <ArrowLeft size={18} />
        <span>Volver al panel principal</span>
      </button>

      {/* Encabezado de la página */}
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Crear Nuevo Usuario</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
          Registra las credenciales de veterinarios, zootecnistas o propietarios del sistema
        </p>
      </div>

      {error && (
        <div
          className="flex items-center justify-between"
          style={{
            backgroundColor: '#ffebee',
            color: 'var(--error)',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            gap: '12px'
          }}
        >
          <span className="flex items-center gap-10" style={{ fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            {error}
          </span>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--error)' }}
          >
            Cerrar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Tarjeta: Datos del usuario */}
        <div className="card" style={{ border: '1px solid #2e7d32', marginBottom: '25px' }}>
          <div className="flex items-center gap-10" style={{ marginBottom: '25px' }}>
            <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '50%' }}>
              <UserPlus size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2e7d32' }}>
                Datos del Usuario
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Los campos marcados con <span style={{ color: '#c62828' }}>*</span> son obligatorios
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="form-group">
              <label htmlFor="username">
                Nombre de Usuario <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                id="username"
                type="text"
                className="form-control"
                placeholder="Ej. juan_perez"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Identificador de inicio de sesión (mínimo 3 caracteres)
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Correo Electrónico <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="ejemplo@agrovet.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group md:col-span-2">
              <label htmlFor="role">
                Rol del Usuario <span style={{ color: '#c62828' }}>*</span>
              </label>
              <select
                id="role"
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                required
              >
                <option value="owner">Propietario</option>
                <option value="veterinarian">Veterinario</option>
                <option value="zootechnician">Zootecnista</option>
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {ROLE_DESCRIPTIONS[role] ?? ''}
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Contraseña <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Mínimo 10 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirmar Contraseña <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <label
            className="flex items-center gap-10"
            style={{ marginTop: '20px', fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#2e7d32', cursor: 'pointer' }}
            />
            Mostrar contraseñas
          </label>
        </div>

        {/* Tarjeta: Perfil del propietario (solo rol owner) */}
        {role === 'owner' && (
          <div className="card" style={{ border: '1px solid #dcedc8', marginBottom: '25px' }}>
            <div className="flex items-center gap-10" style={{ marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f1f8e9', color: '#558b2f', padding: '10px', borderRadius: '50%' }}>
                <Info size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#33691e' }}>
                  Perfil del Propietario
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Opcional: crea su ficha en la sección de Propietarios junto con el usuario
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {existingOwners.length > 0 && (
                <div className="form-group md:col-span-2">
                  <label htmlFor="ownerSelect">Autocompletar con un Propietario Registrado (opcional)</label>
                  <select
                    id="ownerSelect"
                    className="form-control"
                    value={selectedOwnerId}
                    onChange={(e) => handleOwnerSelect(e.target.value)}
                  >
                    <option value="">
                      {loadingOwners ? 'Cargando lista de propietarios...' : '-- Ingresar los datos manualmente --'}
                    </option>
                    {existingOwners.map((own) => (
                      <option key={own.id} value={own.id}>
                        {own.name} (CC: {own.document}) — {own.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="ownerName">Nombre Completo del Propietario</label>
                <input
                  id="ownerName"
                  type="text"
                  className="form-control"
                  placeholder="Ej. Juan Carlos Pérez"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ownerDocument">Documento de Identidad</label>
                <input
                  id="ownerDocument"
                  type="text"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="Ej. 1023456789"
                  value={ownerDocument}
                  onChange={(e) => setOwnerDocument(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ownerPhone">Teléfono de Contacto</label>
                <input
                  id="ownerPhone"
                  type="tel"
                  inputMode="tel"
                  className="form-control"
                  placeholder="Ej. 3101234567"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ownerAddress">Dirección o Predio</label>
                <input
                  id="ownerAddress"
                  type="text"
                  className="form-control"
                  placeholder="Ej. Calle 12 #34 o Vereda La Vega"
                  value={ownerAddress}
                  onChange={(e) => setOwnerAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="ownerType">Ámbito del Propietario</label>
                <select
                  id="ownerType"
                  className="form-control"
                  value={ownerType}
                  onChange={(e) => setOwnerType(e.target.value as 'urban' | 'rural')}
                >
                  <option value="urban">Urbano (mascotas)</option>
                  <option value="rural">Rural (productivo)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-10">
          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={loading}
            className="btn"
            style={{ backgroundColor: '#eceff1', color: '#37474f' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ backgroundColor: '#2e7d32', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Registrando cuenta...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Crear Cuenta de Usuario
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;
