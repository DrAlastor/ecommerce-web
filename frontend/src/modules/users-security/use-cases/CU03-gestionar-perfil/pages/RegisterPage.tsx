import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import api from '../../../../../services/api/api';
import './RegisterPage.css';

// ---- Inline SVG Icons ----
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

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMsg('');
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await api.post('/auth/register', {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        password: formData.password,
      });

      // Redirect to login upon success
      navigate('/login', { state: { message: 'Cuenta creada exitosamente. Por favor, inicia sesión.' } });
    } catch (err: unknown) {
      if (err instanceof AxiosError && err.response) {
        setErrorMsg(err.response.data.message || 'Error al crear la cuenta');
      } else {
        setErrorMsg('Error de conexión con el servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <Link to="/" className="register-back-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Volver al inicio</span>
      </Link>
      <div className="register-left">
        <div className="register-image-overlay">
          <h2 className="register-quote">Unete a Dressly</h2>
          <p className="register-quote-author">Descubre tu propio estilo.</p>
        </div>
      </div>
      <div className="register-right">
        <div className="register-box">
          <div className="register-header">
            <h1 className="register-title">Crear Cuenta</h1>
            <p className="register-subtitle">Completa tus datos para registrarte.</p>
          </div>

          <form onSubmit={handleRegister} className="register-form">
            {errorMsg && (
              <div className="error-message">
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="form-group-row">
              <div className="input-group">
                <div className="input-icon"><UserIcon /></div>
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <div className="input-icon"><UserIcon /></div>
                <input
                  type="text"
                  name="apellido"
                  placeholder="Apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <div className="input-icon"><MailIcon /></div>
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <div className="input-icon"><LockIcon /></div>
              <input
                type="password"
                name="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>

            <div className="input-group">
              <div className="input-icon"><LockIcon /></div>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirmar contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="register-btn" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <div className="register-footer">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="login-link">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
