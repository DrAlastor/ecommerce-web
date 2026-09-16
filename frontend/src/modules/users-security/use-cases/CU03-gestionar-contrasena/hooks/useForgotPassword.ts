import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../../../../services/api/api';

export function useForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, ingresa tu correo electrónico');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/auth/password/forgot', { email: cleanEmail });

      setSuccess('Código de verificación enviado por correo electrónico. Revisa tu bandeja de entrada o spam.');
      setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(cleanEmail)}`), 2200);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || 'Error al solicitar recuperación'
        : 'Error de conexión';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    loading,
    error,
    success,
    handleSubmit,
  };
}
