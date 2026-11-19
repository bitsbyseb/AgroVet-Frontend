import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { ownerService, authService } from '../../services/api';
import type { OwnerInput } from '../../types';
import { ArrowLeft, Save, UserPlus, KeyRound, AlertCircle, Loader2 } from 'lucide-react';

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
    <div className="max-w-3xl mx-auto">
      {/* Botón Volver */}
      <button
        type="button"
        onClick={() => navigate('/owners')}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        style={{ marginBottom: '20px' }}
      >
        <ArrowLeft size={18} />
        <span>Volver a la lista de propietarios</span>
      </button>

      {/* Encabezado de la página */}
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>Registrar Nuevo Propietario</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
          Información básica y de contacto del dueño o tutor responsable
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

      {/* Tarjeta del Formulario */}
      <div className="card" style={{ border: '1px solid #2e7d32' }}>
        <div className="flex items-center gap-10" style={{ marginBottom: '25px' }}>
          <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px', borderRadius: '50%' }}>
            <UserPlus size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2e7d32' }}>
              Datos del Propietario
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Los campos marcados con <span style={{ color: '#c62828' }}>*</span> son obligatorios
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <div className="form-group md:col-span-2">
              <label htmlFor="ownerName">
                Nombre Completo <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                id="ownerName"
                type="text"
                className="form-control"
                placeholder="Ej. Juan Carlos Pérez Gómez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ownerDocument">
                Documento / CC <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                id="ownerDocument"
                type="text"
                inputMode="numeric"
                className="form-control"
                placeholder="Ej. 1023456789"
                value={formData.document}
                onChange={(e) => setFormData({ ...formData, document: e.target.value.replace(/\D/g, '') })}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Solo dígitos, sin puntos ni espacios</span>
            </div>

            <div className="form-group">
              <label htmlFor="ownerPhone">
                Teléfono de Contacto <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                id="ownerPhone"
                type="tel"
                inputMode="tel"
                className="form-control"
                placeholder="Ej. 3101234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                required
              />
            </div>

            <div className="form-group md:col-span-2">
              <label htmlFor="ownerEmail">
                Correo Electrónico <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                id="ownerEmail"
                type="email"
                className="form-control"
                placeholder="juan.perez@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group md:col-span-2">
              <label htmlFor="ownerAddress">
                Dirección de Residencia o Predio <span style={{ color: '#c62828' }}>*</span>
              </label>
              <input
                id="ownerAddress"
                type="text"
                className="form-control"
                placeholder="Ej. Calle 12 # 34-56 o Vereda El Encanto, Finca La Esperanza"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ownerType">Tipo de Propietario <span style={{ color: '#c62828' }}>*</span></label>
              <select
                id="ownerType"
                className="form-control"
                value={formData.ownerType}
                onChange={(e) => setFormData({ ...formData, ownerType: e.target.value as 'urban' | 'rural' })}
                required
              >
                <option value="urban">Urbano (mascotas: caninos y felinos)</option>
                <option value="rural">Rural (productor agropecuario)</option>
              </select>
            </div>
          </div>

          {/* Acceso al portal */}
          <div
            style={{
              backgroundColor: '#f1f8e9',
              border: '1px solid #dcedc8',
              borderRadius: '8px',
              padding: '18px 20px',
              marginTop: '25px'
            }}
          >
            <label
              className="flex items-start gap-10"
              style={{ cursor: 'pointer', margin: 0 }}
            >
              <input
                type="checkbox"
                checked={createPortalAccount}
                onChange={(e) => setCreatePortalAccount(e.target.checked)}
                style={{ marginTop: '3px', width: '16px', height: '16px', accentColor: '#2e7d32', cursor: 'pointer' }}
              />
              <span>
                <span className="flex items-center gap-10" style={{ fontWeight: 600, color: '#1b5e20' }}>
                  <KeyRound size={16} />
                  Crear cuenta de acceso al portal para este propietario
                </span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Podrá iniciar sesión para consultar sus animales, historiales y recordatorios clínicos.
                </span>
              </span>
            </label>

            {createPortalAccount && (
              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5"
                style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dcedc8' }}
              >
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="ownerUsername">Nombre de Usuario (opcional)</label>
                  <input
                    id="ownerUsername"
                    type="text"
                    className="form-control"
                    placeholder="Ej. juan_perez"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Si se deja vacío se genera automáticamente desde el nombre
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="ownerPassword">
                    Contraseña de Acceso <span style={{ color: '#c62828' }}>*</span>
                  </label>
                  <input
                    id="ownerPassword"
                    type="password"
                    className="form-control"
                    placeholder="Mínimo 10 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={createPortalAccount}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div
            className="flex items-center justify-end gap-10"
            style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}
          >
            <button
              type="button"
              onClick={() => navigate('/owners')}
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
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar Propietario
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
