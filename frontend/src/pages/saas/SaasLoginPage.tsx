import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saasService } from '../../modules/saas/services/saas.service';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import './SaasLoginPage.css';

export const SaasLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await saasService.loginSuperAdmin(email, password);
      navigate('/saas-admin/dashboard');
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          'Credenciales de Super Administrador inválidas. Verifica tu correo y contraseña.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saas-login-wrapper">
      <div className="saas-login-container">
        {/* Botón Volver a la Landing */}
        <button
          type="button"
          className="btn-back-landing"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={16} />
          <span>Volver a FashionStore</span>
        </button>

        <div className="saas-login-card">
          <div className="saas-login-header">
            <img 
              src="https://fashionstorestorages.blob.core.windows.net/media/logo-fashionstore.png" 
              onError={(e) => { e.currentTarget.src = '/logo-fashionstore.png'; }}
              alt="FashionStore Logo" 
              className="saas-login-logo-img" 
            />
            <div className="saas-badge-master">
              <ShieldCheck size={16} />
              <span>SUPER ADMIN CONSOLE</span>
            </div>
            <h1 className="saas-login-title">FashionStore SaaS</h1>
            <p className="saas-login-subtitle">
              Acceso maestro a la infraestructura global, Business Intelligence, monitoreo y gestión multi-tenant.
            </p>
          </div>

          {error && (
            <div className="saas-login-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="saas-login-form">
            <div className="saas-login-field">
              <label htmlFor="email" className="saas-login-label">Correo Electrónico Maestro</label>
              <div className="saas-login-input-group">
                <span className="saas-login-input-icon">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  className="saas-login-input"
                  placeholder="superadmin@fashionstore.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="saas-login-field">
              <label htmlFor="password" className="saas-login-label">Contraseña Maestra</label>
              <div className="saas-login-input-group">
                <span className="saas-login-input-icon">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  className="saas-login-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-submit-master" disabled={loading}>
              <span>{loading ? 'Autenticando...' : 'Ingresar a Consola Super Admin'}</span>
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="saas-login-footer">
            <span>¿Eres administrador de una boutique específica?</span>
            <div className="store-links">
              <button type="button" onClick={() => navigate('/store/dressly/login')}>
                Dressly
              </button>
              <span>·</span>
              <button type="button" onClick={() => navigate('/store/urbanly/login')}>
                Urbanly
              </button>
              <span>·</span>
              <button type="button" onClick={() => navigate('/store/aura-sport/login')}>
                Aura Athletics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

