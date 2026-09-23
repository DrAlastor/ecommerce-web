/**
 * @caso-de-uso CU02 — Registrar y gestionar perfil de cliente
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> formulario de perfil -> controlador de perfil -> servicio de clientes -> Usuario/Cliente/Rol.
 */
import React from 'react';
import { Link } from 'react-router-dom';

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

interface RegisterFormProps {
  formData: {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  isLoading: boolean;
  errorMsg: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  formData,
  isLoading,
  errorMsg,
  onChange,
  onSubmit,
}) => {
  return (
    <div className="register-right">
      <div className="register-form-box">
        <h1 className="register-title">Crear Cuenta</h1>
        <p className="register-subtitle">Unete a la mejor experiencia en moda</p>

        {errorMsg && (
          <div className="register-alert" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={onSubmit} className="register-form">
          <div className="form-group-row">
            <div className="form-group">
              <label>Nombre</label>
              <div className="input-with-icon">
                <span className="icon"><UserIcon /></span>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={onChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Apellido</label>
              <div className="input-with-icon">
                <span className="icon"><UserIcon /></span>
                <input
                  type="text"
                  name="apellido"
                  placeholder="Tu apellido"
                  value={formData.apellido}
                  onChange={onChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <div className="input-with-icon">
              <span className="icon"><MailIcon /></span>
              <input
                type="email"
                name="email"
                placeholder="tu@correo.com"
                value={formData.email}
                onChange={onChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <span className="icon"><LockIcon /></span>
              <input
                type="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={onChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Confirmar Contraseña</label>
            <div className="input-with-icon">
              <span className="icon"><LockIcon /></span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={onChange}
                required
                minLength={6}
              />
            </div>
          </div>

          <button type="submit" className="register-submit-btn" disabled={isLoading}>
            {isLoading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <p className="register-login-link">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
};
