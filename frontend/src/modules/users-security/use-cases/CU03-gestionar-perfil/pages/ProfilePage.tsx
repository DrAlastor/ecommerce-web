import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import api from '../../../../../services/api/api';
import { useAuth } from '../../../shared/components/AuthContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, accessToken: token, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    sexo: '',
    fecha_nacimiento: '',
    preferencias_estilo: '',
    telefono: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEmpleado, setIsEmpleado] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        
        const cliente = response.data.user.cliente;
        const empleado = response.data.user.empleado;
        if (cliente) {
          setFormData({
            nombre: cliente.nombre || '',
            apellido: cliente.apellido || '',
            sexo: cliente.sexo || '',
            fecha_nacimiento: cliente.fecha_nacimiento ? cliente.fecha_nacimiento.split('T')[0] : '',
            preferencias_estilo: cliente.preferencias_estilo || '',
            telefono: '',
          });
        } else if (empleado) {
          setIsEmpleado(true);
          setFormData({
            nombre: empleado.nombre || '',
            apellido: empleado.apellido || '',
            sexo: '',
            fecha_nacimiento: '',
            preferencias_estilo: '',
            telefono: empleado.telefono || '',
          });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Error al cargar el perfil' });
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          logout();
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [token, authLoading, navigate, logout]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload: any = {
        nombre: formData.nombre,
        apellido: formData.apellido,
      };

      if (isEmpleado) {
        payload.telefono = formData.telefono;
      } else {
        payload.sexo = formData.sexo;
        payload.preferencias_estilo = formData.preferencias_estilo;
        if (formData.fecha_nacimiento) {
          payload.fecha_nacimiento = formData.fecha_nacimiento;
        }
      }

      await api.patch('/auth/profile', payload);
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar el perfil';
      setMessage({ type: 'error', text: Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.patch('/auth/password/change', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Error al cambiar contraseña' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return <div className="profile-loading">Cargando perfil...</div>;
  }

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        <Link to="/" className="profile-back-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Volver a la tienda</span>
        </Link>
        <div className="profile-header">
          <h1>Mi Perfil</h1>
          <p>Gestiona tu información personal y preferencias de estilo.</p>
        </div>

      <div className="profile-content">
        {message.text && (
          <div className={`profile-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="profile-form" onSubmit={handleSave}>
          <div className="form-section">
            <h2>Datos Personales</h2>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {!isEmpleado && (
              <div className="form-row">
                <div className="form-group">
                  <label>Sexo</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange}>
                    <option value="">Selecciona...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    value={formData.fecha_nacimiento}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label>Correo Electrónico (No editable)</label>
              <input type="email" value={user?.email || ''} disabled className="disabled-input" />
            </div>

            {isEmpleado && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="text"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Carnet de Identidad (CI)</label>
                    <input type="text" value={user?.empleado?.ci || 'No disponible'} disabled className="disabled-input" />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Código de Empleado</label>
                    <input type="text" value={user?.empleado?.codigo_empleado || 'No disponible'} disabled className="disabled-input" />
                  </div>
                  <div className="form-group">
                    <label>Estado</label>
                    <input type="text" value={user?.empleado?.estado || 'No disponible'} disabled className="disabled-input" style={{ textTransform: 'capitalize' }} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Fecha de Contratación</label>
                  <input type="text" value={user?.empleado?.fecha_contratacion ? new Date(user.empleado.fecha_contratacion).toLocaleDateString() : 'No disponible'} disabled className="disabled-input" />
                </div>
              </>
            )}
          </div>

          {!isEmpleado && (
            <div className="form-section">
              <h2>Preferencias de Estilo</h2>
              <div className="form-group">
                <label>Cuéntanos un poco sobre tu estilo (Ej: Minimalista, Urbano, Clásico)</label>
                <textarea
                  name="preferencias_estilo"
                  value={formData.preferencias_estilo}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Escribe tus preferencias aquí..."
                />
              </div>
            </div>
          )}

          <div className="profile-actions">
            <button type="submit" className="save-btn" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>

        <hr style={{ margin: '3rem 0', borderTop: '1px solid #eaeaea' }} />

        {/* Sección para Cambiar Contraseña */}
        <form className="profile-form" onSubmit={handlePasswordChange}>
          <div className="form-section">
            <h2>Seguridad y Acceso</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Cambia tu contraseña para mantener tu cuenta segura.
            </p>

            {passwordMessage.text && (
              <div className={`profile-message ${passwordMessage.type}`}>
                {passwordMessage.text}
              </div>
            )}

            <div className="form-group">
              <label>Contraseña Actual</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="profile-actions">
            <button type="submit" className="save-btn" disabled={isChangingPassword} style={{ backgroundColor: '#1A1A1A' }}>
              {isChangingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>

      </div>
      </div>
    </div>
  );
}
