/**
 * @caso-de-uso CU02 — Registrar y gestionar perfil de cliente
 * @subsistema Usuarios y Seguridad
 * @capa Boundary — Frontend web
 * @responsabilidad Implementa una parte reutilizable de la interfaz de Frontend web y comunica eventos al controlador de presentación.
 * @secuencia Cliente -> formulario de perfil -> controlador de perfil -> servicio de clientes -> Usuario/Cliente/Rol.
 */
import React from 'react';

interface ProfileFormProps {
  formData: {
    nombre: string;
    apellido: string;
    sexo: string;
    fecha_nacimiento: string;
    preferencias_estilo: string;
    telefono: string;
  };
  isEmpleado: boolean;
  user: any;
  isSaving: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  formData,
  isEmpleado,
  user,
  isSaving,
  onChange,
  onSubmit,
}) => {
  return (
    <form className="profile-form" onSubmit={onSubmit}>
      <div className="form-section">
        <h2>Datos Personales</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Apellido</label>
            <input
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={onChange}
              required
            />
          </div>
        </div>

        {!isEmpleado && (
          <div className="form-row">
            <div className="form-group">
              <label>Sexo</label>
              <select name="sexo" value={formData.sexo} onChange={onChange}>
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
                onChange={onChange}
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
                  onChange={onChange}
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
                <label>Rol asignado</label>
                <input type="text" value={user?.rol?.nombre || 'Empleado'} disabled className="disabled-input" />
              </div>
            </div>
          </>
        )}

        {!isEmpleado && (
          <div className="form-group">
            <label>Preferencias de Estilo / Notas de Moda</label>
            <textarea
              name="preferencias_estilo"
              value={formData.preferencias_estilo}
              onChange={onChange}
              placeholder="Ej: Prefiero ropa formal, colores neutros, estilo streetwear..."
              rows={3}
            />
          </div>
        )}

        <button type="submit" className="profile-submit-btn" disabled={isSaving}>
          {isSaving ? 'Guardando cambios...' : 'Guardar Datos'}
        </button>
      </div>
    </form>
  );
};
