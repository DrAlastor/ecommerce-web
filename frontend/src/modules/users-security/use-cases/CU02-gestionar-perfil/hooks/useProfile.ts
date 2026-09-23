/**
 * @caso-de-uso CU02 — Registrar y gestionar perfil de cliente
 * @subsistema Usuarios y Seguridad
 * @capa Control (presentación) — Frontend web
 * @responsabilidad Coordina estado, validaciones y acciones de la interfaz antes de delegar la operación al servicio o API.
 * @secuencia Cliente -> formulario de perfil -> controlador de perfil -> servicio de clientes -> Usuario/Cliente/Rol.
 */
import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../../../../../services/api/api';
import { useAuth } from '../../../shared/components/AuthContext';

export function useProfile() {
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
        payload.sexo = formData.sexo || undefined;
        payload.fecha_nacimiento = formData.fecha_nacimiento || undefined;
        payload.preferencias_estilo = formData.preferencias_estilo || undefined;
      }

      await api.patch('/auth/profile', payload);
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setMessage({ type: 'error', text: err.response.data.message || 'Error al actualizar perfil' });
      } else {
        setMessage({ type: 'error', text: 'Error de red al actualizar perfil' });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordMessage({ type: '', text: '' });
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden' });
      return;
    }

    setIsChangingPassword(true);
    setPasswordMessage({ type: '', text: '' });

    try {
      await api.patch('/auth/password/change', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setPasswordMessage({ type: 'error', text: err.response.data.message || 'Error al cambiar contraseña' });
      } else {
        setPasswordMessage({ type: 'error', text: 'Error de red al cambiar contraseña' });
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return {
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
  };
}
