import React from 'react';
import { Link } from 'react-router-dom';

interface ForgotPasswordFormProps {
  email: string;
  loading: boolean;
  error: string;
  success: string;
  onEmailChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  email,
  loading,
  error,
  success,
  onEmailChange,
  onSubmit,
}) => {
  return (
    <div className="login-box" style={{ maxWidth: '450px' }}>
      <h2 className="login-title">Recuperar Contraseña</h2>
      <p className="login-subtitle">
        Ingresa tu correo y te enviaremos un código para restablecer tu contraseña.
      </p>

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="success-message" style={{ color: 'green', marginBottom: '1rem', textAlign: 'center' }}>
          {success}
        </div>
      )}

      <form onSubmit={onSubmit} className="login-form">
        <div className="form-group">
          <label htmlFor="email">Correo Electrónico</label>
          <input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            disabled={loading}
            className="login-input"
          />
        </div>

        <button
          type="submit"
          className="login-button"
          disabled={loading}
          style={{ backgroundColor: '#1A1A1A' }}
        >
          {loading ? 'Enviando...' : 'Enviar Código'}
        </button>
      </form>

      <div className="login-footer">
        <Link to="/login" className="login-link">Volver al inicio de sesión</Link>
      </div>
    </div>
  );
};
