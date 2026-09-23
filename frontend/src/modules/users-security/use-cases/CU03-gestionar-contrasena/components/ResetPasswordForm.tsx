/**
 * @caso-de-uso CU03 — Gestionar contraseña
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Usuario -> formulario de contraseña -> controlador de credenciales -> servicio de recuperación -> Usuario/Token de recuperación.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, ArrowLeft, AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

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
    <div className="password-card">
      <div className="password-card-header">
        <span className="brand-badge">D R E S S L Y &nbsp;•&nbsp; SEGURIDAD</span>
        <h2 className="password-card-title">Restablecer Contraseña</h2>
        <p className="password-card-subtitle">
          Ingresa el código numérico de 6 dígitos que enviamos a tu buzón y define tu nueva contraseña.
        </p>
      </div>

      {emailParam && (
        <div className="target-account-pill">
          Restableciendo acceso para: <strong>{emailParam}</strong>
        </div>
      )}

      {error && (
        <div className="password-alert-error" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="password-alert-success" role="status">
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="password-form">
        <div className="password-field-group">
          <label htmlFor="token" className="password-field-label">Código de Verificación (6 dígitos)</label>
          <input
            id="token"
            type="text"
            placeholder="123456"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            disabled={loading}
            className="password-input password-code-input"
            maxLength={6}
            required
            autoFocus
          />
        </div>

        <div className="password-field-group">
          <label htmlFor="newPassword" className="password-field-label">Nueva Contraseña</label>
          <div className="password-input-wrapper">
            <Lock size={18} className="password-input-icon" />
            <input
              id="newPassword"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={newPassword}
              onChange={(e) => onNewPasswordChange(e.target.value)}
              disabled={loading}
              className="password-input"
              required
            />
          </div>
        </div>

        <div className="password-field-group">
          <label htmlFor="confirmPassword" className="password-field-label">Confirmar Nueva Contraseña</label>
          <div className="password-input-wrapper">
            <Lock size={18} className="password-input-icon" />
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              disabled={loading}
              className="password-input"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-password-submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Actualizando contraseña...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>Restablecer Contraseña</span>
            </>
          )}
        </button>
      </form>

      <div className="password-card-footer">
        <Link to="/login" className="password-return-link">
          <ArrowLeft size={16} />
          <span>Volver al inicio de sesión</span>
        </Link>
      </div>
    </div>
  );
};
