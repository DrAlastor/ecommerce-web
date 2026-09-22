import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2, KeyRound } from 'lucide-react';

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
    <div className="password-card">
      <div className="password-card-header">
        <span className="brand-badge">D R E S S L Y &nbsp;•&nbsp; SEGURIDAD</span>
        <h2 className="password-card-title">Recuperar Contraseña</h2>
        <p className="password-card-subtitle">
          Ingresa el correo electrónico vinculado a tu cuenta y te enviaremos un código de verificación inmediato.
        </p>
      </div>

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
          <label htmlFor="email" className="password-field-label">Correo Electrónico Registrado</label>
          <div className="password-input-wrapper">
            <Mail size={18} className="password-input-icon" />
            <input
              id="email"
              type="email"
              placeholder="ejemplo@gmail.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              disabled={loading}
              className="password-input"
              required
              autoFocus
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
              <span>Enviando código...</span>
            </>
          ) : (
            <>
              <KeyRound size={18} />
              <span>Enviar Código al Correo</span>
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
