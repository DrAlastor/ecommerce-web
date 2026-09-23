/**
 * @caso-de-uso CU02 — Registrar y gestionar perfil de cliente
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Representa la pantalla principal de Frontend web; compone la interfaz e inicia las acciones del caso de uso.
 * @secuencia Cliente -> formulario de perfil -> controlador de perfil -> servicio de clientes -> Usuario/Cliente/Rol.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useRegister } from '../hooks/useRegister';
import { RegisterForm } from '../components/RegisterForm';
import './RegisterPage.css';

export const RegisterPage: React.FC = () => {
  const { formData, isLoading, errorMsg, handleChange, handleRegister } = useRegister();

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

      <RegisterForm
        formData={formData}
        isLoading={isLoading}
        errorMsg={errorMsg}
        onChange={handleChange}
        onSubmit={handleRegister}
      />
    </div>
  );
};

export default RegisterPage;
