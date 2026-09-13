import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../CU01-iniciar-sesion/pages/LoginPage.css';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error al solicitar recuperación');
      }

      setSuccess('Código de verificación enviado vía correo electrónico. Revisa tu bandeja de entrada o spam.');
      setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`), 2200);
    } catch (err: any) {
      setError(err.message || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: '450px' }}>
        <h2 className="login-title">Recuperar Contraseña</h2>
        <p className="login-subtitle">Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.</p>

        {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
        {success && <div className="success-message" style={{ color: 'green', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="login-input"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading} style={{ backgroundColor: '#1A1A1A' }}>
            {loading ? 'Enviando...' : 'Enviar Código'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/login" className="login-link">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
