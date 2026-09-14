import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import api from '../../../../../services/api/api';

export function useRegister() {
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

  return {
    formData,
    isLoading,
    errorMsg,
    handleChange,
    handleRegister,
  };
}
