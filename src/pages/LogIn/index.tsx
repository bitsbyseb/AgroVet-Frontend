import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { authService } from '../../services/api';
import { Beef } from 'lucide-react';

const LogIn: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit:React.SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authService.login({ email, password });
      localStorage.setItem('token', response.token);
      navigate('/');
    } catch (err: unknown) {
      const axiosError = err as Record<string, unknown>;
      const apiError = (axiosError.response as Record<string, unknown>)?.data as Record<string, any>;
      let errorMessage = 'Error al iniciar sesión. Inténtalo de nuevo.';
      
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

  return (
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', padding: '20px'}}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'inline-flex', backgroundColor: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '50%', marginBottom: '15px' }}>
            <Beef size={32} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>AgroVet</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión Ganadera Profesional</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ backgroundColor: '#ffebee', color: 'var(--error)', padding: '10px', borderRadius: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
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

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              id="password"
              type="password" 
              className="form-control" 
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>¿No tienes cuenta? Contacta a tu administrador.</p>
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '600', display: 'block', marginTop: '5px' }}>O intenta registrarte aquí</Link>
        </div>
      </div>
    </div>
  );
};

export default LogIn;
