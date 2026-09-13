import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import '../../CU01-iniciar-sesion/pages/LoginPage.css';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const emailParam = searchParams.get('email') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanToken = token.trim();

    if (!cleanToken || !newPassword || !confirmPassword) {
      setError('Por favor, completa todos los campos requeridos');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al restablecer contraseña');
      }

      setSuccess('Tu contraseña ha sido restablecida exitosamente. Redirigiendo al inicio de sesión...');
      setTimeout(() => navigate('/login'), 2200);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: '450px' }}>
        <h2 className="login-title">Restablecer Contraseña</h2>
        <p className="login-subtitle">Ingresa el código que recibiste por correo y tu nueva contraseña.</p>

        {emailParam && (
          <div style={{ background: '#f5f5f4', border: '1px solid #e7e5e4', padding: '0.55rem 0.85rem', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '1rem', color: '#57534e', textAlign: 'center' }}>
            Restableciendo acceso para: <strong style={{ color: '#1c1917' }}>{emailParam}</strong>
          </div>
        )}

        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {success && <div className="success-message" style={{ color: 'green', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="token">Código de 6 dígitos</label>
            <input
              id="token"
              type="text"
              placeholder="123456"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              disabled={loading}
              className="login-input"
              style={{ letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">Nueva Contraseña</label>
            <input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              className="login-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="login-input"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading} style={{ backgroundColor: '#1A1A1A' }}>
            {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/login" className="login-link">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
