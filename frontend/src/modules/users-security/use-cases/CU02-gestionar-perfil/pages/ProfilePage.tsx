/**
 * @caso-de-uso CU02 — Registrar y gestionar perfil de cliente
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Cliente -> formulario de perfil -> controlador de perfil -> servicio de clientes -> Usuario/Cliente/Rol.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile';
import { ProfileForm } from '../components/ProfileForm';
import { ChangePasswordCard } from '../components/ChangePasswordCard';
import './ProfilePage.css';

export const ProfilePage: React.FC = () => {
  const {
    user,
    formData,
    isLoading,
    isSaving,
    isChangingPassword,
    isEmpleado,
    message,
    passwordMessage,
    passwordData,
    handleChange,
    handleSave,
    handlePasswordChange,
    handleChangePassword,
  } = useProfile();

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

          <ProfileForm
            formData={formData}
            isEmpleado={isEmpleado}
            user={user}
            isSaving={isSaving}
            onChange={handleChange}
            onSubmit={handleSave}
          />

          <ChangePasswordCard
            passwordData={passwordData}
            passwordMessage={passwordMessage}
            isChangingPassword={isChangingPassword}
            onChange={handlePasswordChange}
            onSubmit={handleChangePassword}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
