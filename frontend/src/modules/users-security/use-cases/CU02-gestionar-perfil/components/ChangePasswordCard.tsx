import React from 'react';

interface ChangePasswordCardProps {
  passwordData: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  passwordMessage: { type: string; text: string };
  isChangingPassword: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ChangePasswordCard: React.FC<ChangePasswordCardProps> = ({
  passwordData,
  passwordMessage,
  isChangingPassword,
  onChange,
  onSubmit,
}) => {
  return (
    <div className="form-section password-section">
      <h2>Seguridad de la Cuenta</h2>
      <p className="section-desc">Actualiza tu contraseña periódicamente para mantener tu cuenta segura.</p>

      {passwordMessage.text && (
        <div className={`profile-message ${passwordMessage.type}`}>
          {passwordMessage.text}
        </div>
      )}

      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Contraseña Actual</label>
          <input
            type="password"
            name="currentPassword"
            value={passwordData.currentPassword}
            onChange={onChange}
            required
            placeholder="Ingresa tu contraseña actual"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Nueva Contraseña</label>
            <input
              type="password"
              name="newPassword"
              value={passwordData.newPassword}
              onChange={onChange}
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="form-group">
            <label>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={onChange}
              required
              minLength={6}
              placeholder="Repite la nueva contraseña"
            />
          </div>
        </div>

        <button type="submit" className="profile-submit-btn secondary" disabled={isChangingPassword}>
          {isChangingPassword ? 'Actualizando...' : 'Cambiar Contraseña'}
        </button>
      </form>
    </div>
  );
};
