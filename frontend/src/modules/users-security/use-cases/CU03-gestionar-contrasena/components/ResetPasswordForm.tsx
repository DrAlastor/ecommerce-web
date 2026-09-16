import React from 'react';
import { Link } from 'react-router-dom';

interface ResetPasswordFormProps {
  token: string;
  emailParam: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  error: string;
  success: string;
  onTokenChange: (val: string) => void;
  onNewPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  token,
  emailParam,
  newPassword,
  confirmPassword,
  loading,
  error,
  success,
  onTokenChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}) => {
  return (
    <div className="login-box" style={{ maxWidth: '450px' }}>
      <h2 className="login-title">Restablecer Contraseña</h2>
      <p className="login-subtitle">Ingresa el código que recibiste por correo y tu nueva contraseña.</p>

      {emailParam && (
        <div style={{ background: '#f5f5f4', border: '1px solid #e7e5e4', padding: '0.55rem 0.85rem', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '1rem', color: '#57534e', textAlign: 'center' }}>
          Restableciendo acceso para: <strong style={{ color: '#1c1917' }}>{emailParam}</strong>
        </div>
      )}

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
          <label htmlFor="token">Código de 6 dígitos</label>
          <input
            id="token"
            type="text"
            placeholder="123456"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            disabled={loading}
            className="login-input"
            style={{ letterSpacing: '2px', textAlign: 'center', fontSize: '1.2rem' }}
            maxLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">Nueva Contraseña</label>
          <input
            id="newPassword"
            type="password"
            placeholder="********"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            disabled={loading}
            className="login-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmar Nueva Contraseña</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="********"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
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
          {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
        </button>
      </form>

      <div className="login-footer">
        <Link to="/login" className="login-link">Volver al inicio de sesión</Link>
      </div>
    </div>
  );
};
